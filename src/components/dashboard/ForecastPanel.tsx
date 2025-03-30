import React, { useEffect, useState, useCallback } from 'react';
import { Activity, Calendar, Navigation, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';

interface ForecastEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'orbital' | 'conjunction' | 'debris' | 'launch';
  impact: 'positive' | 'negative' | 'neutral';
  agency: 'NASA' | 'SPACEX' | 'OTHER';
}

const ForecastItem = ({ event }: { event: ForecastEvent }) => {
  const typeConfig = {
    orbital: {
      icon: Navigation,
      color: 'text-neon-blue',
    },
    conjunction: {
      icon: Activity,
      color: 'text-status-warning',
    },
    debris: {
      icon: ArrowUpRight,
      color: 'text-status-danger',
    },
    launch: {
      icon: ArrowUpRight,
      color: 'text-status-success',
    },
  };

  const { icon: Icon, color } = typeConfig[event.type];

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const impactIcon = event.impact === 'positive' ? 
    <ArrowUpRight className="text-status-success" size={14} /> : 
    event.impact === 'negative' ? 
    <ArrowDownRight className="text-status-danger" size={14} /> : 
    null;

  return (
    <div className="p-3 border-b border-white/5 last:border-0 flex items-start gap-3 hover:bg-white/5 transition-colors">
      <div className={`p-2 rounded-full bg-white/5 ${color}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-semibold text-sm flex items-center gap-1 text-white">
            {event.title}
            {impactIcon}
          </h4>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/80">
            {event.agency}
          </span>
        </div>
        <p className="text-xs text-white/70 mb-1">{event.description}</p>
        <div className="flex items-center text-xs text-white/50">
          <Calendar size={12} className="mr-1" />
          {formatDate(event.timestamp)}
        </div>
      </div>
    </div>
  );
};

const ForecastPanel = ({ className = '' }: { className?: string }) => {
  const [forecasts, setForecasts] = useState<ForecastEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  // Mock data for development
  const mockForecasts: ForecastEvent[] = [
    {
      id: 'iss-mock',
      title: 'ISS Position (Mock)',
      description: 'Lat: 28.52, Lon: -80.60',
      timestamp: new Date().toISOString(),
      type: 'orbital',
      impact: 'neutral',
      agency: 'NASA'
    },
    {
      id: 'launch-mock1',
      title: 'Starlink 6-45',
      description: 'By SpaceX',
      timestamp: new Date(Date.now() + 86400000).toISOString(),
      type: 'launch',
      impact: 'neutral',
      agency: 'SPACEX'
    },
    {
      id: 'debris-mock1',
      title: 'Debris Alert',
      description: 'Possible collision risk',
      timestamp: new Date(Date.now() + 3600000).toISOString(),
      type: 'debris',
      impact: 'negative',
      agency: 'NASA'
    }
  ];

  const updateIssPosition = useCallback((data: any) => {
    setLastUpdated(new Date().toLocaleTimeString());
    setForecasts(prev => {
      const otherEvents = prev.filter(e => e.id !== 'iss-live' && e.id !== 'iss-mock');
      return [
        {
          id: 'iss-live',
          title: 'ISS Position (Live)',
          description: `Lat: ${data.latitude.toFixed(2)}, Lon: ${data.longitude.toFixed(2)}`,
          timestamp: new Date().toISOString(),
          type: 'orbital',
          impact: 'neutral',
          agency: 'NASA'
        },
        ...otherEvents
      ];
    });
  }, []);

  const fetchIssPosition = async () => {
    try {
      // Try primary API first
      const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
      if (!response.ok) throw new Error('Primary API failed');
      return await response.json();
    } catch (primaryError) {
      console.log('Falling back to secondary API');
      try {
        // Try backup API
        const backupResponse = await fetch('https://iss-api.herokuapp.com/iss-now');
        if (!backupResponse.ok) throw new Error('Backup API failed');
        const data = await backupResponse.json();
        return {
          latitude: data.iss_position.latitude,
          longitude: data.iss_position.longitude
        };
      } catch (backupError) {
        console.error('All ISS APIs failed:', backupError);
        throw backupError;
      }
    }
  };

  const fetchLaunchData = useCallback(async () => {
    try {
      const response = await fetch('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=3');
      const data = await response.json();
      
      const launchEvents: ForecastEvent[] = data.results.slice(0, 2).map((launch: any) => ({
        id: `launch-${launch.id}`,
        title: launch.name,
        description: `By ${launch.launch_service_provider?.name || 'Unknown'}`,
        timestamp: launch.net,
        type: 'launch',
        impact: 'neutral',
        agency: launch.launch_service_provider?.name?.includes('SpaceX') ? 'SPACEX' : 'OTHER'
      }));

      setForecasts(prev => {
        const issEvent = prev.find(e => e.id === 'iss-live' || e.id === 'iss-mock');
        return issEvent ? [issEvent, ...launchEvents] : launchEvents;
      });
    } catch (err) {
      console.error('Error fetching launches:', err);
      setError('Failed to load launch data');
    }
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setForecasts(mockForecasts);
      setLoading(false);
      setConnectionStatus('connected');
      return;
    }

    let ws: WebSocket;
    let wsTimeout: NodeJS.Timeout;
    let issInterval: NodeJS.Timeout;
    let launchInterval: NodeJS.Timeout;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const fallbackToPolling = () => {
      setError('Using fallback updates (polling every 10 seconds)');
      // Initial fetch
      fetchIssPosition()
        .then(updateIssPosition)
        .catch(err => {
          console.error('Initial fallback fetch failed:', err);
          setError('Failed to get ISS position updates');
        });
      
      // Set up interval
      issInterval = setInterval(() => {
        fetchIssPosition()
          .then(updateIssPosition)
          .catch(console.error);
      }, 10000);
    };

    const connectWithRetry = () => {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(initWebSocket, 2000 * retryCount);
      } else {
        fallbackToPolling();
      }
    };

    const initWebSocket = () => {
      try {
        ws = new WebSocket('wss://ws.wheretheiss.at');

        ws.onopen = () => {
          clearTimeout(wsTimeout);
          setConnectionStatus('connected');
          setLoading(false);
          ws.send(JSON.stringify({ type: 'subscribe', id: '25544' }));
          
          fetchIssPosition()
            .then(updateIssPosition)
            .catch(err => {
              console.error('ISS fetch error:', err);
              setError('Failed to load ISS position');
            });
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'location') {
              updateIssPosition(data);
            }
          } catch (err) {
            console.error('Error parsing WebSocket data:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          ws.close();
        };

        ws.onclose = () => {
          setConnectionStatus('disconnected');
          connectWithRetry();
        };
      } catch (err) {
        console.error('WebSocket initialization error:', err);
        setConnectionStatus('disconnected');
        fallbackToPolling();
      }
    };

    // Timeout for WebSocket connection (5 seconds)
    wsTimeout = setTimeout(() => {
      if (connectionStatus === 'connecting') {
        setConnectionStatus('disconnected');
        fallbackToPolling();
      }
    }, 5000);

    initWebSocket();

    // Initial data load
    fetchLaunchData();

    // Launch data polling
    launchInterval = setInterval(fetchLaunchData, 60000);

    return () => {
      clearTimeout(wsTimeout);
      clearInterval(issInterval);
      clearInterval(launchInterval);
      if (ws) ws.close();
    };
  }, [updateIssPosition, fetchLaunchData]);

  return (
    <div className={`glass-panel ${className}`}>
      <div className="p-4 border-b border-white/10">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg text-white">Space Forecast</h3>
          <div className="flex items-center text-xs text-white/70 gap-1">
            <span className="bg-white/10 px-2 py-0.5 rounded-full">NASA</span>
            <span className="bg-white/10 px-2 py-0.5 rounded-full">SPACEX</span>
          </div>
        </div>
      </div>
      <div className="max-h-[500px] overflow-auto scrollbar-hide">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="animate-spin text-white/50" size={24} />
            <span className="ml-2 text-sm text-white/70">Connecting to live data...</span>
          </div>
        ) : error ? (
          <div className="p-3 text-xs text-status-warning flex items-center">
            <Activity className="mr-1" size={14} />
            {error}
          </div>
        ) : (
          forecasts.map(event => (
            <ForecastItem key={event.id} event={event} />
          ))
        )}
      </div>
      <div className="p-2 text-xs text-white/30 text-center">
        {connectionStatus === 'connected' ? (
          <span className="flex items-center justify-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
            Live data connected
          </span>
        ) : connectionStatus === 'connecting' ? (
          <span className="flex items-center justify-center">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse"></span>
            Connecting...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
            {`Using fallback updates (last refresh: ${lastUpdated})`}
          </span>
        )}
      </div>
    </div>
  );
};

export default ForecastPanel;
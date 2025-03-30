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

  // Mock data for development and fallback
  const mockForecasts: ForecastEvent[] = [
    {
      id: 'iss-mock',
      title: 'ISS Position',
      description: 'Lat: 28.52, Lon: -80.60',
      timestamp: new Date().toISOString(),
      type: 'orbital',
      impact: 'neutral',
      agency: 'NASA'
    },
    {
      id: 'launch-mock1',
      title: 'Starlink Mission',
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
      const otherEvents = prev.filter(e => !e.id.includes('iss-'));
      return [
        {
          id: 'iss-live',
          title: 'ISS Position',
          description: `Lat: ${data.latitude?.toFixed(2) || 'N/A'}, Lon: ${data.longitude?.toFixed(2) || 'N/A'}`,
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
    const API_ENDPOINTS = [
      'https://api.wheretheiss.at/v1/satellites/25544',
      'https://iss-api.herokuapp.com/iss-now.json',
      'https://api.open-notify.org/iss-now.json'
    ];

    for (const endpoint of API_ENDPOINTS) {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) continue;
        
        const data = await response.json();
        return {
          latitude: data.latitude || data.iss_position?.latitude,
          longitude: data.longitude || data.iss_position?.longitude
        };
      } catch (err) {
        console.warn(`Failed to fetch from ${endpoint}:`, err);
      }
    }
    throw new Error('All ISS APIs failed');
  };

  const fetchLaunchData = useCallback(async () => {
    try {
      // Using SpaceX's more reliable API
      const response = await fetch('https://api.spacexdata.com/v4/launches/upcoming');
      const data = await response.json();
      
      const launchEvents: ForecastEvent[] = data.slice(0, 2).map((launch: any) => ({
        id: `launch-${launch.id}`,
        title: launch.name || 'Upcoming Launch',
        description: `By ${launch.launch_service_provider || 'SpaceX'}`,
        timestamp: launch.date_utc || new Date().toISOString(),
        type: 'launch',
        impact: 'neutral',
        agency: 'SPACEX'
      }));

      setForecasts(prev => {
        const issEvent = prev.find(e => e.id.includes('iss-'));
        return issEvent ? [issEvent, ...launchEvents] : [...launchEvents, ...mockForecasts.slice(1)];
      });
    } catch (err) {
      console.error('Error fetching launches:', err);
      setError('Using cached launch data');
      // Fallback to mock data if no ISS data exists yet
      setForecasts(prev => prev.length > 0 ? prev : mockForecasts);
    }
  }, []);

  useEffect(() => {
    let issInterval: NodeJS.Timeout;
    let launchInterval: NodeJS.Timeout;

    const initDataFetch = async () => {
      try {
        // Skip WebSocket in production
        if (process.env.NODE_ENV !== 'production') {
          try {
            const ws = new WebSocket('wss://ws.wheretheiss.at');
            
            ws.onopen = () => {
              setConnectionStatus('connected');
              ws.send(JSON.stringify({ type: 'subscribe', id: '25544' }));
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

            ws.onclose = () => {
              setConnectionStatus('disconnected');
              startPolling();
            };

            setTimeout(() => {
              if (ws.readyState !== WebSocket.OPEN) {
                ws.close();
              }
            }, 5000);
          } catch (wsError) {
            console.log('WebSocket failed, falling back to polling');
            startPolling();
          }
        } else {
          // In production, use polling directly
          startPolling();
        }

        // Initial data fetch
        await fetchLaunchData();
        setLoading(false);
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Using simulated data');
        setForecasts(mockForecasts);
        setLoading(false);
        setConnectionStatus('disconnected');
      }
    };

    const startPolling = () => {
      setConnectionStatus('connected');
      // Immediate fetch
      fetchIssPosition()
        .then(updateIssPosition)
        .catch(err => {
          console.error('ISS fetch failed:', err);
          setError('Using simulated ISS data');
          setForecasts(prev => prev.some(e => e.id.includes('iss-')) ? prev : [mockForecasts[0], ...prev.filter(e => !e.id.includes('iss-'))]);
        });
      
      // Set up interval
      issInterval = setInterval(() => {
        fetchIssPosition()
          .then(updateIssPosition)
          .catch(console.error);
      }, 15000); // Poll every 15 seconds
    };

    initDataFetch();

    // Launch data polling
    launchInterval = setInterval(fetchLaunchData, 60000);

    return () => {
      clearInterval(issInterval);
      clearInterval(launchInterval);
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
            <span className="ml-2 text-sm text-white/70">Loading space data...</span>
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
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
            {`Updated: ${lastUpdated}`}
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
            Using simulated data
          </span>
        )}
      </div>
    </div>
  );
};

export default ForecastPanel;
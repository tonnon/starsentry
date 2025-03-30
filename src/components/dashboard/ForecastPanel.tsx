import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Activity, Calendar, Navigation, ArrowUpRight, ArrowDownRight, Loader2, Info } from 'lucide-react';

interface ForecastEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'orbital' | 'conjunction' | 'debris' | 'launch';
  impact: 'positive' | 'negative' | 'neutral';
  agency: 'NASA' | 'SPACEX' | 'OTHER';
  details?: {
    altitude?: number;
    velocity?: number;
    distance?: number;
    object1?: string;
    object2?: string;
    probability?: number;
    size?: string;
    launchSite?: string;
    payload?: string;
  };
}

const ForecastItem = ({ event, isVisible }: { event: ForecastEvent; isVisible: boolean }) => {
  const [showDetails, setShowDetails] = useState(false);
  const typeConfig = {
    orbital: {
      icon: Navigation,
      color: 'text-neon-blue',
      bgColor: 'bg-neon-blue/10',
    },
    conjunction: {
      icon: Activity,
      color: 'text-status-warning',
      bgColor: 'bg-status-warning/10',
    },
    debris: {
      icon: ArrowUpRight,
      color: 'text-status-danger',
      bgColor: 'bg-status-danger/10',
    },
    launch: {
      icon: ArrowUpRight,
      color: 'text-status-success',
      bgColor: 'bg-status-success/10',
    },
  };

  const { icon: Icon, color, bgColor } = typeConfig[event.type];

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

  const renderDetails = () => {
    if (!event.details) return null;

    switch (event.type) {
      case 'orbital':
        return (
          <div className="mt-2 text-xs space-y-1">
            <p>Altitude: {event.details.altitude?.toFixed(2) || 'N/A'} km</p>
            <p>Velocity: {event.details.velocity?.toFixed(2) || 'N/A'} km/s</p>
          </div>
        );
      case 'conjunction':
        return (
          <div className="mt-2 text-xs space-y-1">
            <p>Objects: {event.details.object1 || 'N/A'} & {event.details.object2 || 'N/A'}</p>
            <p>Distance: {event.details.distance?.toFixed(2) || 'N/A'} km</p>
            <p>Probability: {event.details.probability?.toFixed(4) || 'N/A'}</p>
          </div>
        );
      case 'debris':
        return (
          <div className="mt-2 text-xs space-y-1">
            <p>Size: {event.details.size || 'N/A'}</p>
            <p>Altitude: {event.details.altitude?.toFixed(2) || 'N/A'} km</p>
          </div>
        );
      case 'launch':
        return (
          <div className="mt-2 text-xs space-y-1">
            <p>Site: {event.details.launchSite || 'N/A'}</p>
            <p>Payload: {event.details.payload || 'N/A'}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`p-3 border-b border-white/5 last:border-0 flex flex-col gap-2 hover:bg-white/5 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${bgColor} ${color}`}>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-white/50">
              <Calendar size={12} className="mr-1" />
              {formatDate(event.timestamp)}
            </div>
            {event.details && (
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors"
              >
                <Info size={12} />
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
            )}
          </div>
        </div>
      </div>
      {showDetails && renderDetails()}
    </div>
  );
};

const ForecastPanel = ({ className = '' }: { className?: string }) => {
  const [forecasts, setForecasts] = useState<ForecastEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [visibleItems, setVisibleItems] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  // Enhanced mock data with details
  const mockForecasts: ForecastEvent[] = [
    {
      id: 'iss-mock',
      title: 'ISS Position',
      description: 'International Space Station current location',
      timestamp: new Date().toISOString(),
      type: 'orbital',
      impact: 'neutral',
      agency: 'NASA',
      details: {
        altitude: 408.5,
        velocity: 7.66
      }
    },
    {
      id: 'launch-mock1',
      title: 'Starlink Mission',
      description: 'Next batch of Starlink satellites',
      timestamp: new Date(Date.now() + 86400000).toISOString(),
      type: 'launch',
      impact: 'neutral',
      agency: 'SPACEX',
      details: {
        launchSite: 'Kennedy Space Center, FL',
        payload: '60 Starlink Satellites'
      }
    },
    {
      id: 'debris-mock1',
      title: 'Debris Alert',
      description: 'Possible collision risk with space debris',
      timestamp: new Date(Date.now() + 3600000).toISOString(),
      type: 'debris',
      impact: 'negative',
      agency: 'NASA',
      details: {
        size: '10cm diameter',
        altitude: 420
      }
    },
    {
      id: 'conjunction-mock1',
      title: 'Conjunction Alert',
      description: 'Satellite close approach detected',
      timestamp: new Date(Date.now() + 7200000).toISOString(),
      type: 'conjunction',
      impact: 'negative',
      agency: 'NASA',
      details: {
        object1: 'ISS',
        object2: 'Defunct Satellite',
        distance: 1.2,
        probability: 0.0032
      }
    },
    {
      id: 'launch-mock2',
      title: 'Artemis Mission',
      description: 'Moon landing mission',
      timestamp: new Date(Date.now() + 172800000).toISOString(),
      type: 'launch',
      impact: 'neutral',
      agency: 'NASA',
      details: {
        launchSite: 'Kennedy Space Center, FL',
        payload: 'Orion Capsule'
      }
    }
  ];

  // Handle scroll to reveal more items
  useEffect(() => {
    const container = containerRef.current;
    if (!container || forecasts.length <= visibleItems) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPosition = scrollTop + clientHeight;
      
      if (scrollPosition >= scrollHeight - 20 && visibleItems < forecasts.length) {
        setVisibleItems(prev => Math.min(prev + 1, forecasts.length));
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [visibleItems, forecasts.length]);

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
          agency: 'NASA',
          details: {
            altitude: data.altitude || 408,
            velocity: data.velocity || 7.66
          }
        },
        ...otherEvents
      ];
    });
    setVisibleItems(3); // Reset visible items when data updates
  }, []);

  const fetchIssPosition = async () => {
    try {
      const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
      if (!response.ok) throw new Error('API failed');
      const data = await response.json();
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude,
        velocity: data.velocity
      };
    } catch (err) {
      console.error('ISS fetch failed:', err);
      throw err;
    }
  };

  const fetchLaunchData = useCallback(async () => {
    try {
      const response = await fetch('https://api.spacexdata.com/v4/launches/upcoming');
      const data = await response.json();
      
      const launchEvents: ForecastEvent[] = data.slice(0, 3).map((launch: any) => ({
        id: `launch-${launch.id}`,
        title: launch.name || 'Upcoming Launch',
        description: `By ${launch.launch_service_provider?.name || 'SpaceX'}`,
        timestamp: launch.date_utc || new Date().toISOString(),
        type: 'launch',
        impact: 'neutral',
        agency: launch.launch_service_provider?.name?.includes('SpaceX') ? 'SPACEX' : 'OTHER',
        details: {
          launchSite: launch.launchpad?.name || 'Unknown',
          payload: launch.payloads?.map((p: any) => p.name).join(', ') || 'Unknown'
        }
      }));

      setForecasts(prev => {
        const issEvent = prev.find(e => e.id.includes('iss-'));
        return issEvent ? [issEvent, ...launchEvents] : [...launchEvents, ...mockForecasts.slice(1)];
      });
      setVisibleItems(3);
    } catch (err) {
      console.error('Error fetching launches:', err);
      setError('Using cached launch data');
      setForecasts(prev => prev.length > 0 ? prev : mockForecasts);
    }
  }, []);

  useEffect(() => {
    let issInterval: NodeJS.Timeout;
    let launchInterval: NodeJS.Timeout;

    const initDataFetch = async () => {
      try {
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
          startPolling();
        }

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
      fetchIssPosition()
        .then(updateIssPosition)
        .catch(err => {
          console.error('ISS fetch failed:', err);
          setError('Using simulated ISS data');
          setForecasts(prev => prev.some(e => e.id.includes('iss-')) ? prev : [mockForecasts[0], ...prev.filter(e => !e.id.includes('iss-'))]);
        });
      
      issInterval = setInterval(() => {
        fetchIssPosition()
          .then(updateIssPosition)
          .catch(console.error);
      }, 15000);
    };

    initDataFetch();

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
      <div 
        ref={containerRef}
        className="overflow-y-auto transition-all duration-300 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent max-h-[300px]"
        style={{ 
          overflowY: forecasts.length > 3 ? 'scroll' : 'hidden'
        }}
      >
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
          forecasts.map((event, index) => (
            <ForecastItem 
              key={event.id} 
              event={event} 
              isVisible={true} // All items are visible, animation controlled by scroll
            />
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
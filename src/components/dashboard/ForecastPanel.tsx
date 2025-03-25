
import React from 'react';
import { Activity, Calendar, Navigation, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ForecastEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'orbital' | 'conjunction' | 'debris';
  impact: 'positive' | 'negative' | 'neutral';
}

interface ForecastPanelProps {
  className?: string;
}

// Mock forecast data
const mockForecasts: ForecastEvent[] = [
  {
    id: 'forecast-1',
    title: 'ISS Orbital Adjustment',
    description: 'Scheduled boost to increase altitude by 1.5km',
    timestamp: '2023-05-16T08:30:00Z',
    type: 'orbital',
    impact: 'positive',
  },
  {
    id: 'forecast-2',
    title: 'Starlink Train Deployment',
    description: 'SpaceX releasing 60 new satellites to orbit',
    timestamp: '2023-05-17T14:20:00Z',
    type: 'orbital',
    impact: 'neutral',
  },
  {
    id: 'forecast-3',
    title: 'Sentinel-2 Conjunction',
    description: 'Close approach with defunct NOAA-16, monitoring',
    timestamp: '2023-05-18T22:45:00Z',
    type: 'conjunction',
    impact: 'negative',
  },
  {
    id: 'forecast-4',
    title: 'Debris Cloud Dispersion',
    description: 'Cosmos debris field expected to disperse further',
    timestamp: '2023-05-20T10:15:00Z',
    type: 'debris',
    impact: 'neutral',
  },
];

const ForecastItem: React.FC<{ event: ForecastEvent }> = ({ event }) => {
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
  };

  const config = typeConfig[event.type];
  const Icon = config.icon;
  
  // Format date to "May 16, 08:30"
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }) + ', ' + date.toLocaleTimeString([], { 
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
      <div className={`p-2 rounded-full bg-white/5 ${config.color}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <h4 className="font-semibold text-sm flex items-center gap-1">
            {event.title}
            {impactIcon}
          </h4>
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

const ForecastPanel: React.FC<ForecastPanelProps> = ({ className = '' }) => {
  return (
    <div className={`glass-panel ${className}`}>
      <div className="p-4 border-b border-white/10">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg text-white">Forecast</h3>
          <div className="flex items-center text-xs text-white/70 gap-1">
            <span className="bg-white/10 px-2 py-0.5 rounded-full">NASA</span>
            <span className="bg-white/10 px-2 py-0.5 rounded-full">ESA</span>
          </div>
        </div>
      </div>
      <div className="max-h-[500px] overflow-auto scrollbar-hide">
        {mockForecasts.map(event => (
          <ForecastItem key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

export default ForecastPanel;

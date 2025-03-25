
import React from 'react';
import { AlertTriangle, ShieldAlert, AlertCircle, ExternalLink } from 'lucide-react';

interface Alert {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
  status: 'active' | 'resolved';
}

interface AlertPanelProps {
  className?: string;
}

// Mock alerts data
const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    title: 'Collision Risk Detected',
    description: 'Potential collision between Starlink-1234 and SL-16 R/B debris in 6h 23m',
    timestamp: '2023-05-15T14:32:00Z',
    severity: 'high',
    status: 'active',
  },
  {
    id: 'alert-2',
    title: 'Trajectory Anomaly',
    description: 'ISS orbit showing unexpected deviation, monitoring required',
    timestamp: '2023-05-15T13:45:00Z',
    severity: 'medium',
    status: 'active',
  },
  {
    id: 'alert-3',
    title: 'Space Weather Alert',
    description: 'CME approaching, potential impact on satellite communications',
    timestamp: '2023-05-15T12:20:00Z',
    severity: 'medium',
    status: 'active',
  },
  {
    id: 'alert-4',
    title: 'Tracking Data Gap',
    description: 'No data received from GPS-IIF-10 for 12 minutes',
    timestamp: '2023-05-15T11:58:00Z',
    severity: 'low',
    status: 'resolved',
  },
];

const AlertItem: React.FC<{ alert: Alert }> = ({ alert }) => {
  const severityConfig = {
    high: {
      icon: ShieldAlert,
      color: 'text-status-danger',
      bg: 'bg-status-danger/10',
      border: 'border-status-danger/30',
    },
    medium: {
      icon: AlertTriangle,
      color: 'text-status-warning',
      bg: 'bg-status-warning/10',
      border: 'border-status-warning/30',
    },
    low: {
      icon: AlertCircle,
      color: 'text-neon-blue',
      bg: 'bg-neon-blue/10',
      border: 'border-neon-blue/30',
    },
  };

  const config = severityConfig[alert.severity];
  const Icon = config.icon;
  
  // Format timestamp
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`p-3 rounded-lg ${config.bg} ${config.border} border mb-3 animate-fade-in transition-all hover:translate-x-1 duration-200`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${config.bg} ${config.color}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <h4 className={`font-semibold text-sm ${config.color}`}>{alert.title}</h4>
            <span className="text-xs text-white/60">{formatTime(alert.timestamp)}</span>
          </div>
          <p className="text-xs text-white/80 mb-2">{alert.description}</p>
          <div className="flex justify-end">
            <button className="text-xs flex items-center gap-1 text-neon-blue hover:text-white transition-colors">
              Details <ExternalLink size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertPanel: React.FC<AlertPanelProps> = ({ className = '' }) => {
  return (
    <div className={`glass-panel ${className}`}>
      <div className="p-4 border-b border-white/10">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg text-white">Real-time Alerts</h3>
          <span className="bg-status-danger px-2 py-0.5 text-xs rounded-full">
            {mockAlerts.filter(a => a.status === 'active').length} Active
          </span>
        </div>
      </div>
      <div className="p-4 max-h-[500px] overflow-auto scrollbar-hide">
        {mockAlerts.map(alert => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
};

export default AlertPanel;

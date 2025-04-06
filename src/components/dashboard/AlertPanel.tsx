import React, { useState, useRef } from 'react';
import { AlertTriangle, ShieldAlert, AlertCircle, ExternalLink, Send, BarChart2, Download, Check, X } from 'lucide-react';
import { jsPDF } from 'jspdf';

// Types
interface Alert {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
  status: 'active' | 'resolved';
  objectsInvolved?: string[];
  collisionProbability?: number;
  missDistance?: string;
  relatedAlerts?: string[];
  externalLinks?: {
    spaceTrack?: string;
    celestrak?: string;
    nasaReport?: string;
  };
}

interface AnalysisData {
  riskScore: number;
  trajectoryAnalysis: {
    timeToEvent: string;
    closestApproach: string;
    relativeVelocity: string;
  };
  riskFactors: {
    name: string;
    value: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  recommendations: {
    action: string;
    priority: 'low' | 'medium' | 'high';
    effectiveness: number;
    applied?: boolean;
    applying?: boolean;
    error?: string;
  }[];
}

interface AlertPanelProps {
  className?: string;
}

// Mock data
const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    title: 'Collision Risk Detected',
    description: 'Potential collision between Starlink-1234 and SL-16 R/B debris',
    timestamp: '2023-05-15T14:32:00Z',
    severity: 'high',
    status: 'active',
    objectsInvolved: ['Starlink-1234 (SAT)', 'SL-16 R/B (DEB)'],
    collisionProbability: 0.15,
    missDistance: '120 ± 50 m',
    relatedAlerts: ['alert-5', 'alert-9'],
    externalLinks: {
      spaceTrack: 'https://www.space-track.org/',
      celestrak: 'https://celestrak.org/'
    }
  },
  {
    id: 'alert-2',
    title: 'Trajectory Anomaly',
    description: 'ISS orbit showing unexpected deviation, monitoring required',
    timestamp: '2023-05-15T13:45:00Z',
    severity: 'medium',
    status: 'active',
    objectsInvolved: ['ISS (ZARYA)']
  },
  {
    id: 'alert-3',
    title: 'Space Weather Alert',
    description: 'CME approaching, potential impact on satellite communications',
    timestamp: '2023-05-15T12:20:00Z',
    severity: 'medium',
    status: 'active',
    externalLinks: {
      nasaReport: 'https://spaceweather.nasa.gov/'
    }
  },
  {
    id: 'alert-4',
    title: 'Tracking Data Gap',
    description: 'No data received from GPS-IIF-10 for 12 minutes',
    timestamp: '2023-05-15T11:58:00Z',
    severity: 'low',
    status: 'resolved'
  }
];

// Helper components for analysis
const RiskMeter = ({ value }: { value: number }) => (
  <div className="w-full bg-gray-700 rounded-full h-2.5 my-2">
    <div 
      className={`h-2.5 rounded-full ${
        value > 70 ? 'bg-red-500' : 
        value > 30 ? 'bg-yellow-500' : 'bg-green-500'
      }`}
      style={{ width: `${value}%` }}
    ></div>
  </div>
);

const RiskFactorItem = ({ name, value, severity }: { name: string; value: string; severity: 'low' | 'medium' | 'high' }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-sm">{name}</span>
    <span className={`text-xs px-2 py-0.5 rounded ${
      severity === 'high' ? 'bg-red-500/20 text-red-400' :
      severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
      'bg-green-500/20 text-green-400'
    }`}>
      {value}
    </span>
  </div>
);

const RecommendationCard = ({ 
  recommendation,
  onApply
}: { 
  recommendation: { 
    action: string; 
    priority: 'low' | 'medium' | 'high'; 
    effectiveness: number;
    applied?: boolean;
    applying?: boolean;
    error?: string;
  };
  onApply: () => Promise<void>;
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-medium">{recommendation.action}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              recommendation.priority === 'high' ? 'bg-red-500/20 text-red-400' :
              recommendation.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {recommendation.priority} priority
            </span>
            <span className="text-xs text-white/60">
              {(recommendation.effectiveness * 100).toFixed(0)}% effective
            </span>
          </div>
          
          {recommendation.error && (
            <div className="text-xs text-red-400 mt-1">{recommendation.error}</div>
          )}
        </div>
        
        {recommendation.applied ? (
          <div className="flex items-center text-xs text-status-success gap-1">
            <Check size={14} /> Applied
          </div>
        ) : (
          <button 
            onClick={onApply}
            disabled={recommendation.applying}
            className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${
              recommendation.applying ? 'bg-white/10' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {recommendation.applying ? (
              <>
                <span className="animate-spin">↻</span> Applying...
              </>
            ) : (
              'Apply'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// AlertItem Component
const AlertItem: React.FC<{ 
  alert: Alert;
  onResolve: (id: string) => void;
  onNotifyTeam: (alert: Alert) => Promise<void>;
}> = ({ alert, onResolve, onNotifyTeam }) => {
  const [expanded, setExpanded] = useState(false);
  const [notificationState, setNotificationState] = useState<{
    status: 'idle' | 'sending' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  
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
  
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleNotify = async () => {
    setNotificationState({ status: 'sending', message: 'Sending notification...' });
    try {
      await onNotifyTeam(alert);
      setNotificationState({ status: 'success', message: 'Team notified successfully!' });
    } catch (error) {
      setNotificationState({ status: 'error', message: 'Failed to notify team' });
    } finally {
      setTimeout(() => setNotificationState({ status: 'idle' }), 3000);
    }
  };

  const handleAnalyze = () => {
    // Generate mock analysis data - replace with real calculations
    setAnalysisData({
      riskScore: alert.collisionProbability ? alert.collisionProbability * 100 : 
                 alert.severity === 'high' ? 75 : 
                 alert.severity === 'medium' ? 45 : 20,
      trajectoryAnalysis: {
        timeToEvent: alert.timestamp ? 
          `${Math.floor((new Date(alert.timestamp).getTime() - Date.now()) / (1000 * 60 * 60))} hours` : 'N/A',
        closestApproach: alert.missDistance || 'Unknown',
        relativeVelocity: '5.2 km/s' // Mock value
      },
      riskFactors: [
        {
          name: 'Collision Probability',
          value: alert.collisionProbability ? `${(alert.collisionProbability * 100).toFixed(1)}%` : 'Unknown',
          severity: alert.severity
        },
        {
          name: 'Object Mass',
          value: 'Large',
          severity: 'high'
        },
        {
          name: 'Orbital Zone',
          value: 'LEO',
          severity: 'medium'
        }
      ],
      recommendations: [
        {
          action: alert.collisionProbability ? 
            `Adjust orbit by ${Math.round(alert.collisionProbability * 100)}km` : 
            'Increase monitoring frequency',
          priority: alert.severity,
          effectiveness: alert.severity === 'high' ? 0.9 : 
                        alert.severity === 'medium' ? 0.7 : 0.5,
          applied: false
        },
        {
          action: 'Prepare contingency plan',
          priority: alert.severity === 'high' ? 'high' : 'medium',
          effectiveness: 0.8,
          applied: false
        },
        {
          action: 'Notify ground stations',
          priority: 'medium',
          effectiveness: 0.6,
          applied: false
        }
      ]
    });
    setShowAnalysis(!showAnalysis);
    setIsAnalyzing(true)
  };

  const handleApplyRecommendation = async (index: number) => {
    if (!analysisData) return;

    // Create a copy of the analysis data
    const updatedAnalysisData = { ...analysisData };
    updatedAnalysisData.recommendations = [...analysisData.recommendations];
    
    // Update the specific recommendation
    updatedAnalysisData.recommendations[index] = {
      ...updatedAnalysisData.recommendations[index],
      applying: true,
      error: undefined
    };
    
    setAnalysisData(updatedAnalysisData);

    try {
      // Simulate API call - replace with your actual implementation
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Randomly succeed or fail for demonstration
          const success = Math.random() > 0.2;
          if (success) {
            resolve(true);
          } else {
            reject(new Error('Failed to apply recommendation'));
          }
        }, 1500);
      });

      // Update the recommendation as applied
      const successAnalysisData = { ...updatedAnalysisData };
      successAnalysisData.recommendations = [...updatedAnalysisData.recommendations];
      successAnalysisData.recommendations[index] = {
        ...successAnalysisData.recommendations[index],
        applied: true,
        applying: false
      };
      
      setAnalysisData(successAnalysisData);

      // Update risk score after successful application
      successAnalysisData.riskScore = Math.max(0, successAnalysisData.riskScore - 
        (successAnalysisData.recommendations[index].effectiveness * 20));
      
      setAnalysisData(successAnalysisData);

    } catch (error) {
      const errorAnalysisData = { ...updatedAnalysisData };
      errorAnalysisData.recommendations = [...updatedAnalysisData.recommendations];
      errorAnalysisData.recommendations[index] = {
        ...errorAnalysisData.recommendations[index],
        applying: false,
        error: error instanceof Error ? error.message : 'Failed to apply recommendation'
      };
      
      setAnalysisData(errorAnalysisData);
    }
  };

  const generatePDFReport = (event: React.MouseEvent<HTMLButtonElement>) => {
    const pdf = new jsPDF();
    
    // Title
    pdf.setFontSize(20);
    pdf.text(`Alert Report: ${alert.title}`, 105, 20, { align: 'center' });
    
    // Alert details
    pdf.setFontSize(12);
    pdf.text(`Description: ${alert.description}`, 15, 40);
    pdf.text(`Severity: ${alert.severity.toUpperCase()}`, 15, 50);
    pdf.text(`Timestamp: ${new Date(alert.timestamp).toLocaleString()}`, 15, 60);
    
    // Analysis section
    if (analysisData) {
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Risk Analysis', 105, 20, { align: 'center' });
      
      // Risk score
      pdf.setFontSize(12);
      pdf.text(`Overall Risk Score: ${analysisData.riskScore.toFixed(0)}/100`, 15, 40);
      
      // Trajectory analysis
      pdf.text('Trajectory Analysis:', 15, 60);
      pdf.text(`- Time to Event: ${analysisData.trajectoryAnalysis.timeToEvent}`, 20, 70);
      pdf.text(`- Closest Approach: ${analysisData.trajectoryAnalysis.closestApproach}`, 20, 80);
      pdf.text(`- Relative Velocity: ${analysisData.trajectoryAnalysis.relativeVelocity}`, 20, 90);
      
      // Recommendations
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Recommended Actions', 105, 20, { align: 'center' });
      
      analysisData.recommendations.forEach((rec, index) => {
        const y = 40 + (index * 20);
        pdf.text(`${index + 1}. ${rec.action} (${rec.priority} priority)`, 15, y);
      });
    }
    
    pdf.save(`alert-report-${alert.id}.pdf`);
  };
  

  return (
    <div className={`p-3 rounded-lg ${config.bg} ${config.border} border mb-3 transition-all`}>
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
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button 
                onClick={() => setExpanded(!expanded)}
                className="text-xs flex items-center gap-1 text-neon-blue hover:text-white transition-colors"
              >
                {expanded ? 'Hide Details' : 'Details'} <ExternalLink size={12} />
              </button>
              
              {alert.status === 'active' && (
                <button 
                  onClick={() => onResolve(alert.id)}
                  className="text-xs flex items-center gap-1 text-status-success hover:text-white transition-colors"
                >
                  Resolve
                </button>
              )}
            </div>
          </div>
          
          {expanded && (
            <div ref={pdfRef} className="mt-3 pt-3 border-t border-white/10 space-y-3">
              {/* Technical Details */}
              {alert.objectsInvolved && (
                <div>
                  <h5 className="text-xs font-medium text-white/70 mb-1">Objects Involved</h5>
                  <ul className="text-xs space-y-1">
                    {alert.objectsInvolved.map(obj => (
                      <li key={obj} className="flex items-center">
                        <span className="inline-block w-2 h-2 rounded-full bg-current mr-2"></span>
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Collision Data */}
              {alert.collisionProbability && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-xs font-medium text-white/70 mb-1">Collision Probability</h5>
                    <div className="w-full bg-black/20 rounded-full h-2">
                      <div 
                        className="bg-status-danger h-2 rounded-full" 
                        style={{ width: `${alert.collisionProbability * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs">{(alert.collisionProbability * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-white/70 mb-1">Miss Distance</h5>
                    <p className="text-xs">{alert.missDistance}</p>
                  </div>
                </div>
              )}
              
              {/* External Links */}
              {alert.externalLinks && (
                <div>
                  <h5 className="text-xs font-medium text-white/70 mb-1">External Resources</h5>
                  <div className="flex flex-wrap gap-2">
                    {alert.externalLinks.spaceTrack && (
                      <a 
                        href={alert.externalLinks.spaceTrack} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 text-neon-blue hover:text-white transition-colors"
                      >
                        Space-Track <ExternalLink size={10} />
                      </a>
                    )}
                    {alert.externalLinks.celestrak && (
                      <a 
                        href={alert.externalLinks.celestrak} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 text-neon-blue hover:text-white transition-colors"
                      >
                        Celestrak <ExternalLink size={10} />
                      </a>
                    )}
                    {alert.externalLinks.nasaReport && (
                      <a 
                        href={alert.externalLinks.nasaReport} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 text-neon-blue hover:text-white transition-colors"
                      >
                        NASA Report <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              {/* Related Alerts */}
              {alert.relatedAlerts && (
                <div>
                  <h5 className="text-xs font-medium text-white/70 mb-1">Related Alerts</h5>
                  <div className="flex gap-2">
                    {alert.relatedAlerts.map(id => (
                      <span key={id} className="text-xs px-2 py-0.5 bg-white/10 rounded-full">
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Notification Status */}
              {notificationState.status !== 'idle' && (
                <div className={`p-2 rounded text-xs ${
                  notificationState.status === 'success' ? 'bg-status-success/10 text-status-success' :
                  notificationState.status === 'error' ? 'bg-status-danger/10 text-status-danger' :
                  'bg-white/10'
                }`}>
                  {notificationState.message}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={handleAnalyze}
                  className={`text-xs flex items-center gap-1 px-2 py-1 rounded ${
                    showAnalysis ? 'bg-neon-blue/20 text-neon-blue' : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <BarChart2 size={12} /> Analyze
                </button>
                <button 
                  onClick={handleNotify}
                  disabled={!isAnalyzing || notificationState.status === 'sending'}
                  className="text-xs flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors disabled:opacity-50"
                  
                >
                  {notificationState.status === 'sending' ? (
                    <>  
                      <span className="animate-spin">↻</span> Sending...
                    </>
                  ) : (
                    <>
                      <Send size={12} /> Notify Team
                    </>
                  )}
                </button>
                <button 
                  onClick={generatePDFReport}
                  className="text-xs flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded disabled:opacity-50" 
                  disabled={!isAnalyzing}>
                  <Download size={12} /> Export
                </button>
              </div>

              {/* Analysis Results - Inline */}
              {showAnalysis && analysisData && (
                <div className="mt-4 space-y-4">
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Overall Risk Assessment</h4>
                    <div className="flex items-center gap-4">
                      <div className="text-3xl font-bold w-20">
                        {analysisData.riskScore.toFixed(0)}
                        <span className="text-sm font-normal opacity-70">/100</span>
                      </div>
                      <div className="flex-1">
                        <RiskMeter value={analysisData.riskScore} />
                        <div className="text-xs mt-1">
                          {analysisData.riskScore > 70 ? 'Critical Risk' : 
                          analysisData.riskScore > 30 ? 'Moderate Risk' : 'Low Risk'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Trajectory Analysis */}
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Trajectory Analysis</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-white/60 mb-1">Time to Event</div>
                        <div>{analysisData.trajectoryAnalysis.timeToEvent}</div>
                      </div>
                      <div>
                        <div className="text-xs text-white/60 mb-1">Closest Approach</div>
                        <div>{analysisData.trajectoryAnalysis.closestApproach}</div>
                      </div>
                      <div>
                        <div className="text-xs text-white/60 mb-1">Relative Velocity</div>
                        <div>{analysisData.trajectoryAnalysis.relativeVelocity}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Risk Factors */}
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Key Risk Factors</h4>
                    <div className="space-y-2">
                      {analysisData.riskFactors.map((factor, index) => (
                        <RiskFactorItem 
                          key={index}
                          name={factor.name}
                          value={factor.value}
                          severity={factor.severity}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Recommendations */}
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Recommended Actions</h4>
                    <div className="space-y-3">
                      {analysisData.recommendations.map((recommendation, index) => (
                        <RecommendationCard 
                          key={index}
                          recommendation={recommendation}
                          onApply={() => handleApplyRecommendation(index)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// AlertPanel Component
const AlertPanel: React.FC<AlertPanelProps> = ({ className = '' }) => {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  
  const handleResolve = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, status: 'resolved' } : alert
    ));
  };
  
  const handleNotifyTeam = async (alert: Alert) => {
    // Simulate API call - replace with your actual implementation
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        // Randomly succeed or fail for demonstration
        const success = Math.random() > 0.2;
        if (success) {
          resolve();
        } else {
          reject(new Error('Failed to send notification'));
        }
      }, 1000);
    });
  };

  return (
    <div className={`glass-panel ${className}`}>
      <div className="p-4 border-b border-white/10">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg text-white">Real-time Alerts</h3>
          <div className="flex gap-2">
            <span className="bg-status-danger px-2 py-0.5 text-xs rounded-full">
              {alerts.filter(a => a.status === 'active').length} Active
            </span>
            <span className="bg-white/10 px-2 py-0.5 text-xs rounded-full">
              {alerts.length} Total
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4 max-h-[500px] overflow-auto scrollbar-hide">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            No active alerts to display
          </div>
        ) : (
          alerts.map(alert => (
            <AlertItem 
              key={alert.id} 
              alert={alert} 
              onResolve={handleResolve}
              onNotifyTeam={handleNotifyTeam}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AlertPanel;
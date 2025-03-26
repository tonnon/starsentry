
import React, { useState } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import AlertPanel from '../components/dashboard/AlertPanel';
import { AlertTriangle, ChevronDown, Filter, Info, Orbit, Radar, ShieldAlert } from 'lucide-react';

// Mock data for collision predictions
const mockCollisionData = [
  {
    id: 'cp1',
    objectA: 'Starlink-1234',
    objectB: 'SL-16 R/B (Debris)',
    probability: 0.0183,
    timeToClosestApproach: '6h 23m',
    distance: 192,
    severity: 'high',
    status: 'monitoring'
  },
  {
    id: 'cp2', 
    objectA: 'ISS',
    objectB: 'Cosmos-1408 Debris',
    probability: 0.0092,
    timeToClosestApproach: '12h 45m',
    distance: 324,
    severity: 'medium',
    status: 'monitoring'
  },
  {
    id: 'cp3',
    objectA: 'NOAA-18',
    objectB: 'Fengyun-1C Debris',
    probability: 0.0071,
    timeToClosestApproach: '22h 10m',
    distance: 510,
    severity: 'medium',
    status: 'monitoring'
  },
  {
    id: 'cp4',
    objectA: 'OneWeb-0276',
    objectB: 'Iridium-33 Debris',
    probability: 0.0047,
    timeToClosestApproach: '15h 32m',
    distance: 725,
    severity: 'low',
    status: 'monitoring'
  },
  {
    id: 'cp5',
    objectA: 'CubeSat-XI',
    objectB: 'Breeze-M Debris',
    probability: 0.0036,
    timeToClosestApproach: '28h 17m',
    distance: 892,
    severity: 'low',
    status: 'monitoring'
  }
];

interface CollisionPredictionCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  className?: string;
}

const CollisionPredictionCard: React.FC<CollisionPredictionCardProps> = ({ 
  title, 
  value, 
  icon, 
  description, 
  className = '' 
}) => {
  return (
    <Card className={`bg-space-light neo-border border-white/10 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-normal text-white/70">{title}</CardTitle>
          <div className="p-1.5 rounded-full bg-space-dark text-neon-blue">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        {description && (
          <CardDescription className="text-white/60 text-xs">{description}</CardDescription>
        )}
      </CardContent>
    </Card>
  );
};

const CollisionPredictions: React.FC = () => {
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);

  // Get statistics from the mock data
  const highRiskCount = mockCollisionData.filter(item => item.severity === 'high').length;
  const totalPredictions = mockCollisionData.length;
  const averageDistance = Math.round(
    mockCollisionData.reduce((acc, item) => acc + item.distance, 0) / mockCollisionData.length
  );

  const handleRowClick = (id: string) => {
    setSelectedPrediction(id === selectedPrediction ? null : id);
  };

  // Helper function to get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-status-danger';
      case 'medium':
        return 'text-status-warning';
      case 'low':
        return 'text-neon-blue';
      default:
        return 'text-white';
    }
  };
  
  // Helper function to get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <ShieldAlert size={16} className="text-status-danger" />;
      case 'medium':
        return <AlertTriangle size={16} className="text-status-warning" />;
      case 'low':
        return <Info size={16} className="text-neon-blue" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-space text-white flex">
      <Sidebar />
      
      <div className="flex-1">
        <div className="p-6">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-glow">Collision Predictions</h1>
            <p className="text-white/70">Real-time analytics for potential orbital conflicts</p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <CollisionPredictionCard 
              title="High Risk Collisions" 
              value={highRiskCount}
              icon={<AlertTriangle size={18} />}
              description="Probability > 0.01" 
            />
            <CollisionPredictionCard 
              title="Total Predictions" 
              value={totalPredictions}
              icon={<Radar size={18} />}
              description="Active monitoring" 
            />
            <CollisionPredictionCard 
              title="Average Miss Distance" 
              value={`${averageDistance} m`}
              icon={<Orbit size={18} />}
              description="Across all predictions" 
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <Card className="neo-border border-white/10 bg-space-dark overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                  <h2 className="font-semibold">Active Collision Predictions</h2>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                      <Filter size={14} />
                      Filter
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-space-light/50">
                        <TableHead className="text-white/70">Objects</TableHead>
                        <TableHead className="text-white/70 text-right">Probability</TableHead>
                        <TableHead className="text-white/70 text-right">Time to TCA</TableHead>
                        <TableHead className="text-white/70 text-right">Miss Distance</TableHead>
                        <TableHead className="text-white/70 text-right">Severity</TableHead>
                        <TableHead className="text-white/70 w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockCollisionData.map((prediction) => (
                        <React.Fragment key={prediction.id}>
                          <TableRow 
                            className={`border-white/10 cursor-pointer ${
                              selectedPrediction === prediction.id ? 'bg-space-light/30' : 'hover:bg-space-light/20'
                            }`}
                            onClick={() => handleRowClick(prediction.id)}
                          >
                            <TableCell>
                              <div>
                                <div className="font-medium">{prediction.objectA}</div>
                                <div className="text-white/60 text-xs">{prediction.objectB}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{prediction.probability.toFixed(4)}</TableCell>
                            <TableCell className="text-right">{prediction.timeToClosestApproach}</TableCell>
                            <TableCell className="text-right">{prediction.distance} m</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {getSeverityIcon(prediction.severity)}
                                <span className={getSeverityColor(prediction.severity)}>
                                  {prediction.severity.charAt(0).toUpperCase() + prediction.severity.slice(1)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <ChevronDown 
                                size={16} 
                                className={`transition-transform ${selectedPrediction === prediction.id ? 'rotate-180' : ''}`} 
                              />
                            </TableCell>
                          </TableRow>
                          {selectedPrediction === prediction.id && (
                            <TableRow className="border-white/10 bg-space-light/10">
                              <TableCell colSpan={6} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <div>
                                    <h4 className="text-neon-blue text-sm mb-2">Primary Object Details</h4>
                                    <div className="text-xs text-white/70 mb-1">ID: SATCAT-{Math.floor(Math.random() * 90000) + 10000}</div>
                                    <div className="text-xs text-white/70 mb-1">Type: Active Satellite</div>
                                    <div className="text-xs text-white/70 mb-1">Altitude: 550 km</div>
                                    <div className="text-xs text-white/70">Inclination: 53.0°</div>
                                  </div>
                                  <div>
                                    <h4 className="text-neon-blue text-sm mb-2">Secondary Object Details</h4>
                                    <div className="text-xs text-white/70 mb-1">ID: SATCAT-{Math.floor(Math.random() * 90000) + 10000}</div>
                                    <div className="text-xs text-white/70 mb-1">Type: Debris</div>
                                    <div className="text-xs text-white/70 mb-1">Size: 10 cm (est.)</div>
                                    <div className="text-xs text-white/70">Origin: 2007 ASAT test</div>
                                  </div>
                                  <div>
                                    <h4 className="text-neon-blue text-sm mb-2">Conjunction Details</h4>
                                    <div className="text-xs text-white/70 mb-1">First detected: 12h ago</div>
                                    <div className="text-xs text-white/70 mb-1">Last updated: 35m ago</div>
                                    <div className="text-xs text-white/70 mb-1">Relative velocity: 14.2 km/s</div>
                                    <div className="text-xs text-white/70">Radial miss: 134 m</div>
                                  </div>
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                  <Button size="sm" variant="outline" className="h-8 text-xs">Analyze Trajectory</Button>
                                  <Button size="sm" className="h-8 text-xs">Mitigate Risk</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>
            <div>
              <AlertPanel className="h-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollisionPredictions;


import React, { useState } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Route, Compass, Settings, Orbit } from 'lucide-react';
import { TrajectorySimulator } from '../components/trajectory/TrajectorySimulator';
import { SatelliteOptionsPanel } from '../components/trajectory/SatelliteOptionsPanel';
import { toast } from '@/components/ui/use-toast';

const TrajectoryOptimization = () => {
  const [selectedSatellite, setSelectedSatellite] = useState<string | null>(null);
  const [optimizationRunning, setOptimizationRunning] = useState(false);
  const [optimizationGoal, setOptimizationGoal] = useState<'fuel' | 'time' | 'safety'>('fuel');

  const satellites = [
    { id: "SAT-001", name: "Explorer-1", type: "LEO", altitude: "550 km", inclination: "51.6°", status: "Active" },
    { id: "SAT-002", name: "Sentinel-2", type: "LEO", altitude: "786 km", inclination: "98.5°", status: "Active" },
    { id: "SAT-003", name: "GeoStar-4", type: "GEO", altitude: "35,786 km", inclination: "0.1°", status: "Active" },
    { id: "SAT-004", name: "CommSat-7", type: "MEO", altitude: "20,200 km", inclination: "55°", status: "Inactive" },
  ];

  const handleOptimize = () => {
    if (!selectedSatellite) return;
    
    setOptimizationRunning(true);
    
    // Simulate optimization process
    setTimeout(() => {
      setOptimizationRunning(false);
      
      // Show success toast
      toast({
        title: "Trajectory Optimized",
        description: `${satellites.find(s => s.id === selectedSatellite)?.name} trajectory has been optimized for ${
          optimizationGoal === 'fuel' ? 'fuel efficiency' : 
          optimizationGoal === 'time' ? 'time optimization' : 
          'collision avoidance'
        }.`,
        variant: "default",
      });
    }, 3000);
  };

  const handleOptimizationGoalChange = (goal: 'fuel' | 'time' | 'safety') => {
    setOptimizationGoal(goal);
  };

  return (
    <div className="min-h-screen bg-space text-white flex">
      <Sidebar />
      
      <div className="flex-1 pl-64">
        <div className="p-6">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-glow">Trajectory Optimization</h1>
            <p className="text-white/70">Optimize satellite trajectories for fuel efficiency and collision avoidance</p>
          </header>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-space-dark border-space-light text-white h-[600px] overflow-hidden">
                <CardHeader className="border-b border-space-light bg-gradient-to-r from-space-dark to-space pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Orbit className="text-purple-400" size={20} />
                    Trajectory Simulator
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Interactive visualization of satellite orbits
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 h-[520px]">
                  <TrajectorySimulator 
                    selectedSatelliteId={selectedSatellite} 
                    optimizationGoal={optimizationGoal}
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-space-dark border-space-light text-white">
                <CardHeader className="border-b border-space-light bg-gradient-to-r from-space-dark to-space pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Route className="text-purple-400" size={20} />
                    Satellite Selection
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Select a satellite to optimize its trajectory
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[250px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-space-light/20 border-b border-space-light">
                          <TableHead className="text-white/70">Name</TableHead>
                          <TableHead className="text-white/70">Type</TableHead>
                          <TableHead className="text-white/70">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {satellites.map((satellite) => (
                          <TableRow 
                            key={satellite.id}
                            className={`cursor-pointer hover:bg-space-light/20 border-b border-space-light ${selectedSatellite === satellite.id ? 'bg-space-light/30' : ''}`}
                            onClick={() => setSelectedSatellite(satellite.id)}
                          >
                            <TableCell className="font-medium">{satellite.name}</TableCell>
                            <TableCell>{satellite.type}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${satellite.status === 'Active' ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'}`}>
                                {satellite.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
              
              {selectedSatellite && (
                <SatelliteOptionsPanel 
                  satellite={satellites.find(s => s.id === selectedSatellite)!}
                  onOptimize={handleOptimize}
                  isOptimizing={optimizationRunning}
                  onOptimizationGoalChange={handleOptimizationGoalChange}
                  optimizationGoal={optimizationGoal}
                />
              )}
              
              {!selectedSatellite && (
                <Card className="bg-space-dark border-space-light text-white">
                  <CardContent className="p-4 flex flex-col items-center justify-center h-[250px] text-center">
                    <Compass className="text-purple-300 mb-3" size={40} />
                    <h3 className="text-lg font-medium mb-2">No Satellite Selected</h3>
                    <p className="text-white/60 text-sm">
                      Select a satellite from the list above to view and optimize its trajectory.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrajectoryOptimization;

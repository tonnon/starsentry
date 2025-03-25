
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Orbit } from 'lucide-react';

interface Satellite {
  id: string;
  name: string;
  type: string;
  altitude: string;
  inclination: string;
  status: string;
}

interface SatelliteOptionsPanelProps {
  satellite: Satellite;
  onOptimize: () => void;
  isOptimizing: boolean;
  onOptimizationGoalChange: (goal: 'fuel' | 'time' | 'safety') => void;
  optimizationGoal: 'fuel' | 'time' | 'safety';
}

export const SatelliteOptionsPanel: React.FC<SatelliteOptionsPanelProps> = ({ 
  satellite,
  onOptimize,
  isOptimizing,
  onOptimizationGoalChange,
  optimizationGoal
}) => {
  const optimizationOptions = [
    { id: 'fuel', label: 'Fuel Efficiency', description: 'Minimize propellant usage' },
    { id: 'time', label: 'Time Optimization', description: 'Minimize transit time' },
    { id: 'safety', label: 'Collision Avoidance', description: 'Maximize safety margins' },
  ];

  return (
    <Card className="bg-space-dark border-space-light text-white">
      <CardHeader className="border-b border-space-light bg-gradient-to-r from-space-dark to-space pb-2">
        <CardTitle className="flex items-center gap-2">
          <Settings className="text-purple-400" size={20} />
          Optimization Options
        </CardTitle>
        <CardDescription className="text-white/60">
          {satellite.name} ({satellite.id})
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-white/80 mb-2">Satellite Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-white/60">Type:</div>
              <div>{satellite.type}</div>
              <div className="text-white/60">Altitude:</div>
              <div>{satellite.altitude}</div>
              <div className="text-white/60">Inclination:</div>
              <div>{satellite.inclination}</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-white/80 mb-2">Optimization Goal</h4>
            <div className="space-y-2">
              {optimizationOptions.map((option) => (
                <div 
                  key={option.id} 
                  className={`p-2 rounded-md cursor-pointer border transition-colors duration-200 ${
                    optimizationGoal === option.id 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-space-light hover:bg-space-light/30'
                  }`}
                  onClick={() => onOptimizationGoalChange(option.id as any)}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-white/60">{option.description}</div>
                </div>
              ))}
            </div>
          </div>
          
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700 mt-2"
            onClick={onOptimize}
            disabled={isOptimizing}
          >
            {isOptimizing ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                Optimizing...
              </>
            ) : (
              <>
                <Orbit className="mr-2 h-4 w-4" />
                Optimize Trajectory
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

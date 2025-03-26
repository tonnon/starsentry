
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Settings, Compass } from 'lucide-react';
import { Slider } from "@/components/ui/slider";

interface TrajectorySimulatorProps {
  selectedSatelliteId: string | null;
  optimizationGoal?: 'fuel' | 'time' | 'safety';
}

export const TrajectorySimulator: React.FC<TrajectorySimulatorProps> = ({ 
  selectedSatelliteId,
  optimizationGoal = 'fuel'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(10);
  const animationRef = useRef<number | null>(null);
  const earthRef = useRef<HTMLDivElement>(null);
  const satelliteRef = useRef<HTMLDivElement>(null);
  const debrisRef = useRef<HTMLDivElement[]>([]);
  const time = useRef(0);

  // Generate random space debris
  const spaceDebris = Array.from({ length: 5 }, (_, i) => ({
    id: `debris-${i}`,
    size: Math.random() * 2 + 1,
    distance: Math.random() * 40 + 120,
    speed: Math.random() * 0.5 + 0.2,
    color: `rgb(${Math.random() * 100 + 100}, ${Math.random() * 100 + 100}, ${Math.random() * 100 + 150})`,
    angle: Math.random() * Math.PI * 2,
    inclination: Math.random() * 0.3 - 0.15,
  }));

  // Calculate satellite orbit parameters based on optimization goal
  const getSatelliteOrbitParams = () => {
    switch (optimizationGoal) {
      case 'fuel':
        return { 
          distance: 80, 
          speed: 0.3, 
          color: 'rgb(64, 196, 255)',
          trailColor: 'rgba(64, 196, 255, 0.2)',
          trailLength: 0.6
        };
      case 'time':
        return { 
          distance: 70, 
          speed: 0.5, 
          color: 'rgb(255, 128, 64)',
          trailColor: 'rgba(255, 128, 64, 0.2)',
          trailLength: 0.8
        };
      case 'safety':
        return { 
          distance: 100, 
          speed: 0.25, 
          color: 'rgb(64, 255, 128)',
          trailColor: 'rgba(64, 255, 128, 0.2)',
          trailLength: 0.4
        };
      default:
        return { 
          distance: 80, 
          speed: 0.3, 
          color: 'rgb(64, 196, 255)',
          trailColor: 'rgba(64, 196, 255, 0.2)',
          trailLength: 0.6
        };
    }
  };

  const orbitParams = getSatelliteOrbitParams();

  useEffect(() => {
    if (selectedSatelliteId) {
      setIsLoading(true);
      // Simulate loading the trajectory data
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [selectedSatelliteId]);

  useEffect(() => {
    if (!selectedSatelliteId || isLoading) return;

    const animate = () => {
      time.current += (simulationSpeed / 500);
      
      // Animate satellite
      if (satelliteRef.current) {
        const satAngle = time.current * orbitParams.speed;
        const x = Math.cos(satAngle) * orbitParams.distance;
        const y = Math.sin(satAngle) * orbitParams.distance;
        
        satelliteRef.current.style.transform = `translate(${x}px, ${y}px)`;
        
        // Create or update satellite trail
        updateSatelliteTrail(satAngle, orbitParams.distance);
      }

      // Animate space debris
      spaceDebris.forEach((debris, index) => {
        if (debrisRef.current[index]) {
          const debrisAngle = time.current * debris.speed + debris.angle;
          const x = Math.cos(debrisAngle) * debris.distance;
          const y = Math.sin(debrisAngle) * debris.distance * Math.cos(debris.inclination);
          const z = Math.sin(debrisAngle) * debris.distance * Math.sin(debris.inclination);
          
          debrisRef.current[index].style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [selectedSatelliteId, isLoading, simulationSpeed, optimizationGoal]);

  // Create and update satellite trail
  const updateSatelliteTrail = (currentAngle: number, distance: number) => {
    const trailLength = 20;
    const trailContainer = document.getElementById('satellite-trail');
    
    if (!trailContainer) return;
    
    // Clear existing trail
    trailContainer.innerHTML = '';
    
    // Create new trail points
    for (let i = 0; i < trailLength; i++) {
      const trailAngle = currentAngle - (i * 0.05 * orbitParams.trailLength);
      const x = Math.cos(trailAngle) * distance;
      const y = Math.sin(trailAngle) * distance;
      
      const trailPoint = document.createElement('div');
      trailPoint.className = 'absolute rounded-full';
      trailPoint.style.width = `${4 - (i * 0.15)}px`;
      trailPoint.style.height = `${4 - (i * 0.15)}px`;
      trailPoint.style.backgroundColor = orbitParams.trailColor;
      trailPoint.style.opacity = `${1 - (i / trailLength)}`;
      trailPoint.style.transform = `translate(${x}px, ${y}px)`;
      
      trailContainer.appendChild(trailPoint);
    }
  };

  return (
    <div className="relative h-full w-full">
      {isLoading ? (
        <div className="flex items-center justify-center h-full w-full">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 border-4 border-t-purple-500 border-r-transparent border-b-purple-300 border-l-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white/70">Loading trajectory data...</p>
          </div>
        </div>
      ) : selectedSatelliteId ? (
        <div className="h-full w-full flex flex-col">
          <div className="flex-1 relative overflow-hidden">
            {/* Earth visualization */}
            <div className="h-full w-full bg-gradient-to-b from-[#000420] to-[#000b33] flex items-center justify-center overflow-hidden">
              <div className="relative">
                {/* Earth */}
                <div 
                  ref={earthRef}
                  className="w-48 h-48 rounded-full bg-blue-500 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 30% 30%, rgb(0, 150, 255), rgb(0, 50, 150))',
                    boxShadow: '0 0 40px rgba(0, 100, 255, 0.3)'
                  }}
                >
                  <div className="w-full h-full rounded-full opacity-30"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100%25\' height=\'100%25\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'smallGrid\' width=\'8\' height=\'8\' patternUnits=\'userSpaceOnUse\'%3E%3Cpath d=\'M 8 0 L 0 0 0 8\' fill=\'none\' stroke=\'rgba(255,255,255,0.3)\' stroke-width=\'0.5\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'url(%23smallGrid)\'/%3E%3C/svg%3E")',
                    }}
                  ></div>
                </div>
                
                {/* Satellite trail container */}
                <div id="satellite-trail" className="absolute left-1/2 top-1/2 z-10"></div>
                
                {/* Satellite */}
                <div 
                  ref={satelliteRef}
                  className="w-6 h-6 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                  style={{ transform: `translate(${orbitParams.distance}px, 0)` }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div 
                      className="w-4 h-4 rounded-sm transform rotate-45"
                      style={{ 
                        backgroundColor: orbitParams.color,
                        boxShadow: `0 0 10px ${orbitParams.color}`
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Space debris */}
                {spaceDebris.map((debris, index) => (
                  <div 
                    key={debris.id}
                    ref={el => { if (el) debrisRef.current[index] = el; }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
                    style={{ 
                      width: `${debris.size}px`, 
                      height: `${debris.size}px`,
                      backgroundColor: debris.color,
                      borderRadius: '50%',
                      boxShadow: `0 0 ${debris.size * 2}px ${debris.color}`,
                      transform: `translate(${debris.distance}px, 0)`
                    }}
                  ></div>
                ))}
              </div>
            </div>
            
            {/* Optimization status overlay */}
            <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm rounded-md p-2 text-xs text-white/90">
              <div className="flex flex-col gap-1">
                <div className="flex items-center">
                  <span className="w-20">Optimization:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    optimizationGoal === 'fuel' ? 'bg-blue-500/30 text-blue-300' :
                    optimizationGoal === 'time' ? 'bg-orange-500/30 text-orange-300' :
                    'bg-green-500/30 text-green-300'
                  }`}>
                    {optimizationGoal === 'fuel' ? 'Fuel Efficiency' :
                     optimizationGoal === 'time' ? 'Time Optimization' :
                     'Collision Avoidance'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <span className="w-20">Altitude:</span>
                  <span>{Math.round(orbitParams.distance / 2)} km</span>
                </div>
                
                <div className="flex items-center">
                  <span className="w-20">Velocity:</span>
                  <span>{Math.round(orbitParams.speed * 10000)} m/s</span>
                </div>
              </div>
          {/* Simulation controls */}
          <div className="h-12 bg-space-dark border-t border-space-light p-6 mt-3 flex items-center gap-3">
            <div className="text-white/70 text-xs">Simulation Speed:</div>
              <div className="w-32">
                <Slider
                  value={[simulationSpeed]}
                  onValueChange={(values) => setSimulationSpeed(values[0])}
                  min={10}
                  max={100}
                  step={1}
                  className="bg-space-light"
                />
              </div>
              <div className="text-white/80 text-xs">
                {simulationSpeed < 30 ? 'Slow' : simulationSpeed < 70 ? 'Normal' : 'Fast'}
               </div>
              </div>
             </div>
            </div>
          </div>
      ) : (
        <div className="flex items-center justify-center h-full text-center p-6">
          <div className="flex flex-col items-center max-w-md">
            <Compass className="text-purple-300 mb-4" size={60} />
            <h3 className="text-xl font-medium mb-3">Select a Satellite</h3>
            <p className="text-white/60">
              Choose a satellite from the panel on the right to visualize and optimize its trajectory.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

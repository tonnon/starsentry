import { useEffect, useState } from 'react';
import { Satellite, Shield, Radar, AlertTriangle } from 'lucide-react';
import Map from '../components/dashboard/SpaceMap';
import AlertPanel from '../components/dashboard/AlertPanel';
import ForecastPanel from '../components/dashboard/ForecastPanel';
import InfoCard from '../components/dashboard/InfoCard';
import Sidebar from '../components/sidebar/Sidebar';

const Dashboard = () => {
  // Mock data
  const mockSpaceData = {
    activeSatellites: 4523,
    trackedDebris: 28754,
    collisionAlerts: 18,
    orbitAdjustments: 23
  };

  const [spaceData, setSpaceData] = useState(mockSpaceData);
  const [loading, setLoading] = useState(false); // No loading needed with mock data
  const [error, setError] = useState('');

  // No need for useEffect with API calls since we're using mock data
  // Keeping this in case you want to simulate loading/refreshing
  useEffect(() => {
    // Simulate data refresh every 5 minutes
    const interval = setInterval(() => {
      // You could add small random variations to the mock data here
      setSpaceData({
        ...mockSpaceData,
        collisionAlerts: mockSpaceData.collisionAlerts + Math.floor(Math.random() * 3 - 1), // Random +/- 1
        orbitAdjustments: mockSpaceData.orbitAdjustments + Math.floor(Math.random() * 2)
      });
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-space text-white flex">
      <Sidebar />
      
      <div className="flex-1">
        <div className="p-6">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-glow">Live Tracking</h1>
            <p className="text-white/70">Real-time satellite and debris monitoring system</p>
          </header>
          
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <InfoCard 
              title="Active Satellites" 
              value={spaceData.activeSatellites.toLocaleString()} 
              icon={<Satellite size={20} />}
              trend={{ value: 3.8, isPositive: true }}
            />
            <InfoCard 
              title="Tracked Debris" 
              value={spaceData.trackedDebris.toLocaleString()} 
              icon={<Radar size={20} />}
              trend={{ value: 2.1, isPositive: false }}
            />
            <InfoCard 
              title="Collision Alerts" 
              value={spaceData.collisionAlerts.toString()} 
              icon={<AlertTriangle size={20} />}
              trend={{ value: 12.5, isPositive: false }}
            />
            <InfoCard 
              title="Orbit Adjustments" 
              value={spaceData.orbitAdjustments.toString()} 
              icon={<Shield size={20} />}
              trend={{ value: 5.2, isPositive: true }}
            />
          </div>
          
          {error && <div className="text-red-500 mb-4">{error}</div>}
          
          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Map takes up 3/4 of the space */}
            <div className="lg:col-span-3 h-full">
              <Map className="h-full w-full" />
            </div>
            
            {/* Right sidebar with alerts */}
            <div className="flex flex-col gap-6">
              <AlertPanel />
              <ForecastPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
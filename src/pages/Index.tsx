import { useEffect, useState } from 'react';
import { Satellite, Shield, Radar, AlertTriangle } from 'lucide-react';
import Map from '../components/dashboard/SpaceMap';
import AlertPanel from '../components/dashboard/AlertPanel';
import ForecastPanel from '../components/dashboard/ForecastPanel';
import InfoCard from '../components/dashboard/InfoCard';
import Sidebar from '../components/sidebar/Sidebar';
import { fetchSpaceData } from '@/services/nasaService';

const Dashboard = () => {

  const [spaceData, setSpaceData] = useState({
    activeSatellites: 0,
    trackedDebris: 0,
    collisionAlerts: 0,
    orbitAdjustments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchSpaceData();
        setSpaceData(data);
      } catch (err) {
        setError('Failed to load NASA data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // Atualiza a cada 5 minutos
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /* if (loading) return <div>Loading space data...</div>; */
  
  return (
    <div className="min-h-screen bg-space text-white flex">
      <Sidebar />
      
      <div className="flex-1">
        {/* Main Content */}
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
      
      {error && <div className="text-red-500">{error}</div>}
          
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

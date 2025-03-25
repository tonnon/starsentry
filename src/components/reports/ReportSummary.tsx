
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, AlertTriangle, Orbit, History } from 'lucide-react';
import InfoCard from '@/components/dashboard/InfoCard';

interface ReportSummaryProps {
  timeRange: 'day' | 'week' | 'month' | 'year';
  onTimeRangeChange: (range: 'day' | 'week' | 'month' | 'year') => void;
}

const ReportSummary: React.FC<ReportSummaryProps> = ({ 
  timeRange, 
  onTimeRangeChange 
}) => {
  const getReportData = () => {
    // In a real app, this would fetch from an API based on timeRange
    switch (timeRange) {
      case 'day':
        return {
          maneuvers: 3,
          anomalies: 1,
          collisionRisks: 2,
          uptime: 99.8
        };
      case 'week':
        return {
          maneuvers: 12,
          anomalies: 4,
          collisionRisks: 8,
          uptime: 99.5
        };
      case 'month':
        return {
          maneuvers: 42,
          anomalies: 15,
          collisionRisks: 26,
          uptime: 99.2
        };
      case 'year':
        return {
          maneuvers: 487,
          anomalies: 128,
          collisionRisks: 251,
          uptime: 98.7
        };
    }
  };

  const data = getReportData();

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="text-lg font-medium">Report Statistics</div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onTimeRangeChange('day')}
            className={`${timeRange === 'day' ? 'bg-purple-500/20 border-purple-500' : 'bg-space-dark border-space-light'}`}
          >
            Day
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onTimeRangeChange('week')}
            className={`${timeRange === 'week' ? 'bg-purple-500/20 border-purple-500' : 'bg-space-dark border-space-light'}`}
          >
            Week
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onTimeRangeChange('month')}
            className={`${timeRange === 'month' ? 'bg-purple-500/20 border-purple-500' : 'bg-space-dark border-space-light'}`}
          >
            Month
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onTimeRangeChange('year')}
            className={`${timeRange === 'year' ? 'bg-purple-500/20 border-purple-500' : 'bg-space-dark border-space-light'}`}
          >
            Year
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard 
          title="Orbital Maneuvers" 
          value={data.maneuvers.toString()} 
          icon={<Orbit size={24} />}
          trend={{ value: 8, isPositive: true }}
        />
        <InfoCard 
          title="System Anomalies" 
          value={data.anomalies.toString()} 
          icon={<AlertTriangle size={24} />}
          trend={{ value: 2, isPositive: false }}
        />
        <InfoCard 
          title="Collision Risks" 
          value={data.collisionRisks.toString()} 
          icon={<BarChart3 size={24} />}
          trend={{ value: 5, isPositive: false }}
        />
        <InfoCard 
          title="System Uptime" 
          value={`${data.uptime}%`} 
          icon={<History size={24} />}
          trend={{ value: 0.3, isPositive: true }}
        />
      </div>
    </div>
  );
};

export default ReportSummary;

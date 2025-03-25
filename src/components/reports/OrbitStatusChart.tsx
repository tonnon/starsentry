
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface OrbitStatusChartProps {
  timeRange: 'day' | 'week' | 'month' | 'year';
}

const OrbitStatusChart: React.FC<OrbitStatusChartProps> = ({ timeRange }) => {
  // Generate sample data based on time range
  const generateData = () => {
    let data = [];
    let labels = [];
    
    switch (timeRange) {
      case 'day':
        labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
        break;
      case 'week':
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        break;
      case 'month':
        labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        break;
      case 'year':
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        break;
    }
    
    data = labels.map(label => ({
      name: label,
      optimal: Math.floor(Math.random() * 25) + 75,
      adjusted: Math.floor(Math.random() * 30) + 20,
    }));
    
    return data;
  };

  const data = generateData();
  
  const chartConfig = {
    optimal: {
      label: "Optimal Orbit",
      color: "#8B5CF6"
    },
    adjusted: {
      label: "Adjusted Orbit",
      color: "#60A5FA"
    }
  };

  return (
    <div className="h-80">
      <ChartContainer config={chartConfig}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="name" 
            stroke="rgba(255,255,255,0.5)" 
            tick={{ fill: 'rgba(255,255,255,0.7)' }}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.5)" 
            tick={{ fill: 'rgba(255,255,255,0.7)' }}
            domain={[0, 100]}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
          />
          <Bar dataKey="optimal" stackId="a" fill="var(--color-optimal)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="adjusted" stackId="a" fill="var(--color-adjusted)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
};

export default OrbitStatusChart;

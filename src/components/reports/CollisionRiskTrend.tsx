
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

interface CollisionRiskTrendProps {
  timeRange: 'day' | 'week' | 'month' | 'year';
}

const CollisionRiskTrend: React.FC<CollisionRiskTrendProps> = ({ timeRange }) => {
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
      highRisk: Math.floor(Math.random() * 5),
      mediumRisk: Math.floor(Math.random() * 10) + 5,
      lowRisk: Math.floor(Math.random() * 15) + 10,
    }));
    
    return data;
  };

  const data = generateData();
  
  const chartConfig = {
    highRisk: {
      label: "High Risk",
      color: "#EF4444"
    },
    mediumRisk: {
      label: "Medium Risk",
      color: "#F59E0B"
    },
    lowRisk: {
      label: "Low Risk",
      color: "#10B981"
    }
  };

  return (
    <div className="h-70 ml-[-40px]">
      <ChartContainer config={chartConfig}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="name" 
            stroke="rgba(255,255,255,0.5)" 
            tick={{ fill: 'rgba(255,255,255,0.7)' }}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.5)" 
            tick={{ fill: 'rgba(255,255,255,0.7)' }}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
          />
          <ReferenceLine y={12} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
          <Line 
            type="monotone" 
            dataKey="highRisk" 
            stroke="var(--color-highRisk)" 
            strokeWidth={2} 
            dot={{ fill: 'var(--color-highRisk)', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="mediumRisk" 
            stroke="var(--color-mediumRisk)" 
            strokeWidth={2} 
            dot={{ fill: 'var(--color-mediumRisk)', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="lowRisk" 
            stroke="var(--color-lowRisk)" 
            strokeWidth={2} 
            dot={{ fill: 'var(--color-lowRisk)', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <ChartLegend content={<ChartLegendContent />} />
        </LineChart>
      </ChartContainer>
    </div>
  );
};

export default CollisionRiskTrend;

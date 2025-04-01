
import React, { ReactNode } from 'react';

interface InfoCardProps {
  title: string;
  value: React.ReactNode;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, value, icon, trend, className = '' }) => {
  return (
    <div className={`glass-panel p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,194,255,0.2)] ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/70 text-sm">{title}</span>
        <div className="text-neon-blue">{icon}</div>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-xl font-semibold">{value}</div>
        {trend && (
          <div className={`flex items-center text-xs ${trend.isPositive ? 'text-status-success' : 'text-status-danger'}`}>
            {trend.isPositive ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m18 9-6-6-6 6"/><path d="M12 3v18"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m18 15-6 6-6-6"/><path d="M12 3v18"/></svg>
            )}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoCard;

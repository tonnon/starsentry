
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Radar, AlertTriangle, OrbitIcon, BarChart3, GlobeIcon, Settings, LogOut } from 'lucide-react';
import Logo from '../logo/Logo';

interface SidebarItemProps {
  icon: React.ElementType;
  text: string;
  to: string;
  isActive: boolean;
  isCollapsed: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, text, to, isActive, isCollapsed }) => {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-space-light text-neon-blue' 
          : 'text-white/70 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon className={`${isActive ? 'text-neon-blue' : ''} transition-all duration-200`} size={20} />
      {!isCollapsed && (
        <span className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          {text}
        </span>
      )}
      {isActive && !isCollapsed && (
        <div className="absolute left-0 w-1 h-8 bg-neon-blue rounded-r-full"></div>
      )}
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { icon: Radar, text: 'Live Tracking', to: '/' },
    { icon: AlertTriangle, text: 'Collision Predictions', to: '/collision-predictions' },
    { icon: OrbitIcon, text: 'Trajectory Optimization', to: '/trajectory-optimization' },
    { icon: BarChart3, text: 'Reports & Analytics', to: '/reports' },
  ];

  return (
    <div 
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } vh-full flex flex-col bg-space-dark neo-border border-r transition-all duration-300 ease-in-out z-20 top-0 left-0`}
    >
      
      <div className={`p-4 ${isCollapsed ? '' : 'flex flex-col'}`}>
        <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-full bg-space-light hover:bg-space text-white/70 hover:text-white transition-colors"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <div className=' mb-2 flex justify-center'>
          <Logo  centered={true} />
        </div>

      </div>

      <div className="mt-4 flex flex-col gap-2 flex-1 px-2">
        {navItems.map((item) => (
          <SidebarItem
            key={item.to}
            icon={item.icon}
            text={item.text}
            to={item.to}
            isActive={isActive(item.to)}
            isCollapsed={isCollapsed}
          />
        ))}
      </div>

      <div className="border-t border-white/10 mt-auto pt-2 px-2 pb-4">
        <SidebarItem
          icon={Settings}
          text="Settings"
          to="/settings"
          isActive={isActive('/settings')}
          isCollapsed={isCollapsed}
        />
      </div>
    </div>
  );
};

export default Sidebar;

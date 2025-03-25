
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  centered?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'xl', centered = false }) => {
  return (
    <div className={`flex ${centered ? 'justify-center' : 'items-center'} ${className}`}>
      <div className={`relative`}>
        <img 
          src="/logo.png" 
          alt="StarSentry Logo" 
          className={`object-contain`}
        />
      </div>
    </div>
  );
};

export default Logo;

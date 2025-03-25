
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface TimelineProps {
  className?: string;
}

const Timeline: React.FC<TimelineProps> = ({ className = '' }) => {
  const [currentValue, setCurrentValue] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Calculate the displayed time based on the slider value
  // Value 0 = -24h, 50 = now, 100 = +24h
  const getTimeDisplay = () => {
    const hourOffset = Math.round((currentValue - 50) * 0.48); // 48 hours range (-24 to +24)
    
    if (hourOffset === 0) {
      return "Current Time";
    }
    
    const absHours = Math.abs(hourOffset);
    const timeStr = absHours === 1 ? "1 hour" : `${absHours} hours`;
    
    return hourOffset < 0 ? `${timeStr} ago` : `${timeStr} ahead`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(parseInt(e.target.value));
  };

  const stepBack = () => {
    setCurrentValue(prev => Math.max(0, prev - 5));
  };

  const stepForward = () => {
    setCurrentValue(prev => Math.min(100, prev + 5));
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`glass-panel ${className}`}>
      <div className="p-3 flex items-center justify-between">
        <button 
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          onClick={stepBack}
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="flex-1 mx-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-white/60">-24h</span>
            <span className="text-sm font-medium">{getTimeDisplay()}</span>
            <span className="text-xs text-white/60">+24h</span>
          </div>
          
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={currentValue}
              onChange={handleSliderChange}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-blue [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,194,255,0.7)]"
            />
            
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-px h-8 bg-white/40"></div>
          </div>
          
          <div className="flex justify-between mt-1">
            <div className="h-3 border-l border-white/20 ml-[20%]"></div>
            <div className="h-4 border-l border-white/40"></div>
            <div className="h-3 border-l border-white/20 mr-[20%]"></div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue transition-colors"
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            onClick={stepForward}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Timeline;

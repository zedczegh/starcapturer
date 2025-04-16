
import React from 'react';
import { DEEP_GALAXY_BG } from '@/assets/index';

interface BackgroundWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const BackgroundWrapper: React.FC<BackgroundWrapperProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div 
      className={`min-h-screen relative ${className}`}
      style={{
        backgroundImage: `url(${DEEP_GALAXY_BG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-cosmic-950/80 via-cosmic-950/50 to-cosmic-950/80 z-0" />
      
      {/* Content wrapper */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default BackgroundWrapper;

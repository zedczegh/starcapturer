
import React from 'react';
import { cn } from '@/lib/utils';

interface BorderlessFrameProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle';
}

const BorderlessFrame: React.FC<BorderlessFrameProps> = ({ 
  children, 
  className = '', 
  variant = 'default' 
}) => {
  const baseClasses = "rounded-lg transition-all duration-300";
  
  const variantClasses = {
    default: "bg-cosmic-900/40 backdrop-blur-md shadow-lg",
    elevated: "bg-cosmic-900/60 backdrop-blur-lg shadow-xl hover:shadow-2xl",
    subtle: "bg-cosmic-900/20 backdrop-blur-sm shadow-md"
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </div>
  );
};

export default BorderlessFrame;

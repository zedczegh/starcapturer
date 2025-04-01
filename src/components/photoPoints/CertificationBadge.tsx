
import React from 'react';
import { Award, Shield, Building, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CertificationBadgeProps {
  certification?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CertificationBadge: React.FC<CertificationBadgeProps> = ({ 
  certification, 
  className,
  size = 'md'
}) => {
  if (!certification) return null;
  
  let icon = <Award />;
  let color = 'text-blue-400';
  let label = certification;
  
  // Determine icon and color based on certification type
  if (certification.includes('Sanctuary')) {
    icon = <Shield />;
    color = 'text-purple-400';
  } else if (certification.includes('Reserve')) {
    icon = <Award />;
    color = 'text-blue-400';
  } else if (certification.includes('Park')) {
    icon = <MapPin />;
    color = 'text-green-400';
  } else if (certification.includes('Community')) {
    icon = <Building />;
    color = 'text-amber-400';
  }
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  return (
    <div className={cn(
      'inline-flex items-center rounded-full border',
      'border-blue-400/20 bg-blue-400/10',
      sizeClasses[size],
      className
    )}>
      <span className={cn(color, iconSizes[size])}>
        {icon}
      </span>
      <span className={cn('font-medium', color)}>
        {label}
      </span>
    </div>
  );
};

export default CertificationBadge;

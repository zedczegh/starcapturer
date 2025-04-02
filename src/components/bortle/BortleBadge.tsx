
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface BortleBadgeProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
}

const BortleBadge: React.FC<BortleBadgeProps> = ({ value, size = 'md' }) => {
  // Get color for Bortle scale
  const getBortleColor = (value: number) => {
    if (value <= 3) return 'text-green-400 bg-green-400/10 border-green-400/30'; // Good
    if (value <= 5) return 'text-amber-400 bg-amber-400/10 border-amber-400/30'; // Average
    return 'text-red-400 bg-red-400/10 border-red-400/30'; // Poor
  };
  
  // Determine size classes
  const sizeClasses = {
    sm: 'text-xs py-0 px-1.5',
    md: 'text-xs py-0.5 px-2',
    lg: 'text-sm py-1 px-2.5'
  }[size];
  
  // Format value (show decimal only if needed)
  const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  
  return (
    <Badge 
      className={`font-medium ${sizeClasses} ${getBortleColor(value)}`}
    >
      B{formattedValue}
    </Badge>
  );
};

export default BortleBadge;

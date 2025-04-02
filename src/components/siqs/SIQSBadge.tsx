
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { siqsToColor } from '@/lib/siqs/utils';

interface SIQSBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const SIQSBadge: React.FC<SIQSBadgeProps> = ({ score, size = 'md' }) => {
  // Get color based on score
  const color = siqsToColor(score);
  
  // Format score to one decimal place
  const formattedScore = score.toFixed(1);
  
  // Determine size classes
  const sizeClasses = {
    sm: 'text-xs py-0 px-1.5',
    md: 'text-xs py-0.5 px-2',
    lg: 'text-sm py-1 px-2.5'
  }[size];
  
  return (
    <Badge 
      className={`font-medium ${sizeClasses} border border-white/10`}
      style={{ 
        backgroundColor: `${color}30`, 
        color: color,
        borderColor: `${color}40`
      }}
    >
      SIQS {formattedScore}
    </Badge>
  );
};

export default SIQSBadge;

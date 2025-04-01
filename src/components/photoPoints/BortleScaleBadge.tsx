
import React from 'react';
import { cn } from '@/lib/utils';
import { Eye } from 'lucide-react';

interface BortleScaleBadgeProps {
  bortleScale: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BortleScaleBadge: React.FC<BortleScaleBadgeProps> = ({
  bortleScale,
  showLabel = true,
  size = 'md',
  className
}) => {
  // Get color based on Bortle scale
  const getBortleColor = (scale: number) => {
    switch (true) {
      case scale <= 1: return 'text-indigo-400 border-indigo-400/20 bg-indigo-400/10';
      case scale <= 3: return 'text-blue-400 border-blue-400/20 bg-blue-400/10';
      case scale <= 4: return 'text-green-400 border-green-400/20 bg-green-400/10';
      case scale <= 6: return 'text-amber-400 border-amber-400/20 bg-amber-400/10';
      default: return 'text-red-400 border-red-400/20 bg-red-400/10';
    }
  };
  
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
  
  const color = getBortleColor(bortleScale);
  
  return (
    <div className={cn(
      'inline-flex items-center rounded-full border',
      color,
      sizeClasses[size],
      className
    )}>
      <Eye className={cn(iconSizes[size])} />
      <span className="font-medium">{bortleScale}</span>
      {showLabel && (
        <span className="font-medium">Bortle</span>
      )}
    </div>
  );
};

export default BortleScaleBadge;

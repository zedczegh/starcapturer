
import React from 'react';
import { Star, StarHalf, StarOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SiqsRatingProps {
  siqs?: number;
  bortleScale?: number;
  showValue?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SiqsRating: React.FC<SiqsRatingProps> = ({
  siqs,
  bortleScale,
  showValue = true,
  showLabel = true,
  size = 'md',
  className
}) => {
  // If SIQS is not provided but Bortle scale is, estimate SIQS
  const finalSiqs = siqs ?? (bortleScale ? Math.max(1, 10 - bortleScale) : undefined);
  
  if (finalSiqs === undefined) return null;
  
  // Number of full, half and empty stars to display
  const fullStars = Math.floor(finalSiqs / 2);
  const hasHalfStar = finalSiqs % 2 >= 1;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  // Size classes for the component
  const sizeClasses = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  // Determine color based on SIQS value
  let color = 'text-amber-400';
  if (finalSiqs >= 8) {
    color = 'text-green-400';
  } else if (finalSiqs <= 4) {
    color = 'text-red-400';
  }
  
  return (
    <div className={cn('flex items-center', sizeClasses[size], className)}>
      <div className="flex items-center">
        {Array(fullStars).fill(0).map((_, i) => (
          <Star key={`full-${i}`} className={cn(color, iconSizes[size], 'fill-current')} />
        ))}
        
        {hasHalfStar && (
          <StarHalf key="half" className={cn(color, iconSizes[size], 'fill-current')} />
        )}
        
        {Array(emptyStars).fill(0).map((_, i) => (
          <StarOff key={`empty-${i}`} className={cn('text-muted-foreground/40', iconSizes[size])} />
        ))}
      </div>
      
      {showValue && (
        <span className={cn('font-medium', color, textSizes[size])}>
          {finalSiqs.toFixed(1)}
        </span>
      )}
      
      {showLabel && (
        <span className={cn('text-muted-foreground', textSizes[size])}>
          SIQS
        </span>
      )}
    </div>
  );
};

export default SiqsRating;

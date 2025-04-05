
import React, { memo } from 'react';
import { Loader2, Star } from 'lucide-react';
import { formatSIQSScoreForDisplay } from '@/hooks/siqs/siqsCalculationUtils';
import { cn } from '@/lib/utils';

interface SiqsScoreBadgeProps {
  score: number;
  loading?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  certified?: boolean;
}

/**
 * Enhanced SIQS Score badge component with better performance and visual design
 */
const SiqsScoreBadge: React.FC<SiqsScoreBadgeProps> = memo(({ 
  score, 
  loading = false, 
  size = 'md',
  className = '',
  certified = false
}) => {
  // Size-based styling
  const sizeClasses = {
    xs: {
      badge: 'px-1.5 py-0.5',
      icon: 'h-2.5 w-2.5 mr-0.5',
      text: 'text-2xs' // Extra small text
    },
    sm: {
      badge: 'px-2 py-0.5',
      icon: 'h-3 w-3 mr-1',
      text: 'text-xs'
    },
    md: {
      badge: 'px-2.5 py-1',
      icon: 'h-3.5 w-3.5 mr-1.5',
      text: 'text-sm'
    },
    lg: {
      badge: 'px-3 py-1.5',
      icon: 'h-4 w-4 mr-1.5',
      text: 'text-base'
    }
  };
  
  const currentSize = sizeClasses[size];
  
  // Determine color based on score and certified status
  const getBadgeColor = () => {
    if (certified) {
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
    
    if (score >= 8) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    } else if (score >= 6) {
      return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    } else if (score >= 4) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    } else {
      return 'bg-red-500/20 text-red-300 border-red-500/40';
    }
  };
  
  // Determine icon color based on score and certified status
  const getIconColor = () => {
    if (certified) {
      return 'text-blue-400 fill-blue-400';
    }
    
    if (score >= 8) {
      return 'text-emerald-400 fill-emerald-400';
    } else if (score >= 6) {
      return 'text-yellow-400 fill-yellow-400';
    } else if (score >= 4) {
      return 'text-amber-400 fill-amber-400';
    } else {
      return 'text-red-400 fill-red-400';
    }
  };
  
  return (
    <div className={cn(
      `flex items-center ${currentSize.badge} rounded-full border`,
      getBadgeColor(),
      className
    )}>
      {loading ? (
        <Loader2 className={`${currentSize.icon} animate-spin`} />
      ) : (
        <Star className={`${currentSize.icon} ${getIconColor()}`} />
      )}
      <span className={`${currentSize.text} font-medium tabular-nums`}>
        {loading ? '...' : formatSIQSScoreForDisplay(score)}
      </span>
    </div>
  );
});

// Display name for better component identification in React DevTools
SiqsScoreBadge.displayName = 'SiqsScoreBadge';

export default SiqsScoreBadge;

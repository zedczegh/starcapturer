
import React, { useMemo } from 'react';
import { Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SiqsScoreBadgeProps {
  score: number | null;
  loading?: boolean;
  compact?: boolean;
  className?: string;
  showTitle?: boolean;
  isCertified?: boolean;
  forceCertified?: boolean;
}

/**
 * Optimized SIQS Score Badge component with memoized values
 */
const SiqsScoreBadge: React.FC<SiqsScoreBadgeProps> = ({
  score,
  loading = false,
  compact = false,
  className = '',
  showTitle = true,
  isCertified = false,
  forceCertified = true
}) => {
  // Memoize values to prevent unnecessary recalculations
  const displayValues = useMemo(() => {
    const defaultScore = forceCertified && isCertified ? 7 : 0;
    const displayScore = score !== null && !isNaN(score) ? score : defaultScore;
    
    // Get color based on score
    let bgColor, textColor, borderColor;
    
    if (displayScore >= 8) {
      bgColor = 'bg-emerald-500/20';
      textColor = 'text-emerald-300';
      borderColor = 'border-emerald-500/30';
    } else if (displayScore >= 6) {
      bgColor = 'bg-green-500/20';
      textColor = 'text-green-300';
      borderColor = 'border-green-500/30';
    } else if (displayScore >= 4) {
      bgColor = 'bg-yellow-500/20';
      textColor = 'text-yellow-300';
      borderColor = 'border-yellow-500/30';
    } else if (displayScore >= 2) {
      bgColor = 'bg-orange-500/20';
      textColor = 'text-orange-300';
      borderColor = 'border-orange-500/30';
    } else {
      bgColor = 'bg-red-500/20';
      textColor = 'text-red-300';
      borderColor = 'border-red-500/30';
    }
    
    return {
      displayScore,
      bgColor,
      textColor,
      borderColor
    };
  }, [score, isCertified, forceCertified]);
  
  // Determine what to show based on loading and score
  let content;
  
  if (loading) {
    // Spinner for loading state
    content = (
      <div className="flex items-center justify-center h-full">
        <Loader size={16} className="animate-spin" />
      </div>
    );
  } else if (score === null) {
    // N/A for no score
    content = (
      <div className="flex items-center justify-center h-full">
        <span className="text-xs">N/A</span>
      </div>
    );
  } else {
    // Formatted score
    const formattedScore = displayValues.displayScore.toFixed(1);
    content = compact ? formattedScore : `${formattedScore}/10`;
  }
  
  return (
    <div className={cn('flex flex-col', className)}>
      {showTitle && !compact && (
        <span className="text-xs text-muted-foreground mb-1">SIQS</span>
      )}
      <div 
        className={cn(
          'rounded px-2 py-1 font-semibold border shadow-sm flex items-center justify-center',
          displayValues.bgColor,
          displayValues.textColor,
          displayValues.borderColor,
          compact ? 'text-xs min-w-[40px] h-6' : 'text-sm min-w-[56px]'
        )}
      >
        {content}
      </div>
    </div>
  );
};

export default React.memo(SiqsScoreBadge);

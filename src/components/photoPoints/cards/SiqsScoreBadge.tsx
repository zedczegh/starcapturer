
import React from 'react';
import { Loader2, Star } from 'lucide-react';
import { formatSIQSScoreForDisplay } from '@/hooks/siqs/siqsCalculationUtils';
import { getProgressColor } from '@/components/siqs/utils/progressColor';

interface SiqsScoreBadgeProps {
  score: number;
  loading?: boolean;
  compact?: boolean;
}

const SiqsScoreBadge: React.FC<SiqsScoreBadgeProps> = ({ score, loading = false, compact = false }) => {
  const scoreColor = getProgressColor(score);
  
  // Generate a light background color based on the score color
  const bgColor = `${scoreColor}40`; // Increased opacity for better visibility
  
  // Inline styles for dynamic coloring
  const badgeStyle = {
    backgroundColor: bgColor,
    borderColor: scoreColor,
    color: scoreColor
  };
  
  return (
    <div 
      className={`flex items-center ${compact ? 'px-2 py-0.5' : 'px-2.5 py-1'} rounded-full border shadow-sm`}
      style={badgeStyle}
    >
      {loading ? (
        <Loader2 className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} mr-1.5 animate-spin`} />
      ) : (
        <Star className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} mr-1.5`} fill={scoreColor} />
      )}
      <span className={`${compact ? 'text-2xs' : 'text-xs'} font-medium`}>
        {loading ? '...' : formatSIQSScoreForDisplay(score)}
      </span>
    </div>
  );
};

export default SiqsScoreBadge;

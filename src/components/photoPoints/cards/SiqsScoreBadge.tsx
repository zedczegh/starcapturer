
import React from 'react';
import { Loader2, Star } from 'lucide-react';
import { getProgressColor } from '@/components/siqs/utils/progressColor';

interface SiqsScoreBadgeProps {
  score: number;
  loading?: boolean;
  compact?: boolean;
}

const SiqsScoreBadge: React.FC<SiqsScoreBadgeProps> = ({ score, loading = false, compact = false }) => {
  // Ensure score is on a 0-10 scale and is valid
  const validScore = isNaN(score) ? 0 : Math.min(10, Math.max(0, score));
  
  const scoreColor = getProgressColor(validScore);
  
  // Generate a light background color based on the score color with higher opacity for better visibility
  const bgColor = `${scoreColor}60`; // Increased opacity for better visibility
  
  // Format the score with one decimal place
  const formatSIQSScoreForDisplay = (score: number) => {
    return score.toFixed(1);
  };
  
  // Inline styles for dynamic coloring with higher contrast
  const badgeStyle = {
    backgroundColor: bgColor,
    borderColor: scoreColor,
    color: scoreColor,
    boxShadow: compact ? '0 1px 3px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.2)'
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
      <span className={`${compact ? 'text-2xs font-bold' : 'text-xs font-medium'}`}>
        {loading ? '...' : formatSIQSScoreForDisplay(validScore)}
      </span>
    </div>
  );
};

export default SiqsScoreBadge;


import React from 'react';
import { Loader2, Star } from 'lucide-react';
import { formatSIQSScoreForDisplay } from '@/hooks/siqs/siqsCalculationUtils';
import { getProgressColor } from '@/components/siqs/utils/progressColor';

interface SiqsScoreBadgeProps {
  score: number;
  loading?: boolean;
}

const SiqsScoreBadge: React.FC<SiqsScoreBadgeProps> = ({ score, loading = false }) => {
  const scoreColor = getProgressColor(score);
  
  // Generate a light background color based on the score color
  const bgColor = `${scoreColor}30`;
  
  // Inline styles for dynamic coloring
  const badgeStyle = {
    backgroundColor: bgColor,
    borderColor: scoreColor,
    color: scoreColor
  };
  
  return (
    <div 
      className="flex items-center px-2.5 py-1 rounded-full border shadow-sm"
      style={badgeStyle}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      ) : (
        <Star className="h-3.5 w-3.5 mr-1.5" fill={scoreColor} />
      )}
      <span className="text-xs font-medium">
        {loading ? '...' : formatSIQSScoreForDisplay(score)}
      </span>
    </div>
  );
};

export default SiqsScoreBadge;

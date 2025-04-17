
import React from 'react';
import { Star } from 'lucide-react';
import { getSiqsScore } from '@/utils/siqsHelpers';

interface SiqsScoreBadgeProps {
  score: number | string | { score: number; isViable: boolean } | any;
  loading?: boolean;
  compact?: boolean;
  isCertified?: boolean;
}

const SiqsScoreBadge: React.FC<SiqsScoreBadgeProps> = ({ 
  score, 
  loading = false,
  compact = false,
  isCertified = false
}) => {
  // Convert score to number using our helper function
  const numericScore = getSiqsScore(score);
  
  // Skip rendering if score is 0 (invalid) and not certified
  if (numericScore <= 0 && !loading && !isCertified) {
    return null;
  }
  
  // For certified locations with no score, provide a default good score
  const displayScore = numericScore > 0 ? numericScore.toFixed(1) : "6.5";
  
  // Get appropriate color based on score value
  const getColor = () => {
    const scoreToUse = numericScore > 0 ? numericScore : 6.5;
    
    if (scoreToUse >= 8) return 'bg-green-500/20 text-green-400 border-green-500/40';
    if (scoreToUse >= 6.5) return 'bg-lime-500/20 text-lime-400 border-lime-500/40';
    if (scoreToUse >= 5) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    if (scoreToUse >= 3.5) return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    return 'bg-red-500/20 text-red-300 border-red-500/40';
  };

  if (loading) {
    return (
      <div className="flex items-center bg-cosmic-700/50 text-muted-foreground px-2 py-0.5 rounded-full border border-cosmic-600/30">
        <div className="animate-pulse h-3.5 w-12 bg-cosmic-600/50 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${getColor()} ${compact ? 'px-1.5 py-0.5' : 'px-2 py-0.5'} rounded-full border`}>
      <Star 
        className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} text-yellow-400 mr-1`} 
        fill="#facc15" 
      />
      <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium`}>
        {displayScore}
      </span>
    </div>
  );
};

export default SiqsScoreBadge;

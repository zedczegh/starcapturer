
import React, { useState, useEffect } from 'react';
import { Star } from "lucide-react";
import { formatSiqsForDisplay, getSiqsScore } from '@/utils/siqsHelpers';
import { useIsMobile } from '@/hooks/use-mobile';

interface SiqsScoreBadgeProps {
  score: number | { score: number; isViable: boolean } | null;
  loading?: boolean;
  compact?: boolean;
  className?: string;
  isCertified?: boolean;
  forceCertified?: boolean;
  confidenceScore?: number;
}

const SiqsScoreBadge: React.FC<SiqsScoreBadgeProps> = ({
  score,
  loading = false,
  compact = false,
  className = '',
  isCertified = false,
  forceCertified = false,
  confidenceScore = 10
}) => {
  const isMobile = useIsMobile();
  const [stabilizedScore, setStabilizedScore] = useState<number | null>(null);
  
  // Extract numeric score from any score format
  const numericScore = score !== null ? getSiqsScore(score) : null;
  
  // Update stabilized score when the numeric score changes
  useEffect(() => {
    if (numericScore !== null && numericScore > 0) {
      setStabilizedScore(numericScore);
    }
  }, [numericScore]);
  
  // Use stabilized score if available, otherwise use the current score
  const displayNumericScore = stabilizedScore !== null ? stabilizedScore : numericScore;
  
  // Format score for display
  const displayScore = formatSiqsForDisplay(displayNumericScore);
  
  // Get color class based on score value
  const getColorClass = (scoreValue: number | null) => {
    if (scoreValue === null) return 'text-muted-foreground';
    if (scoreValue >= 8) return 'text-green-500';
    if (scoreValue >= 6) return 'text-yellow-400';
    if (scoreValue >= 4) return 'text-amber-500';
    if (scoreValue >= 2) return 'text-orange-500';
    return 'text-red-500';
  };
  
  const colorClass = getColorClass(displayNumericScore);
  const showCertificationStar = isCertified || forceCertified;
  
  // Make badge sizing responsive
  const getBadgeSize = () => {
    if (isMobile && compact) {
      return 'h-4';
    } else if (compact) {
      return 'h-5';
    } else {
      return 'h-6';
    }
  };
  
  // Show loading skeleton if loading and no stabilized score
  if (loading && !stabilizedScore) {
    return (
      <div className={`flex items-center ${getBadgeSize()} ${className}`}>
        <div className="animate-pulse bg-muted-foreground/20 rounded h-full w-12"></div>
      </div>
    );
  }
  
  // Regular badge view
  return (
    <div 
      className={`flex items-center ${showCertificationStar ? 'gap-1' : ''} ${className}`}
      title={`SIQS: ${displayScore}${confidenceScore < 8 ? ' (Estimated)' : ''}`}
    >
      {showCertificationStar && (
        <Star 
          className={`${isMobile && compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} ${isCertified ? 'text-yellow-400 fill-yellow-400' : 'text-muted'}`} 
        />
      )}
      <span className={`${compact ? (isMobile ? 'text-xs' : 'text-sm') : 'text-base'} font-medium ${colorClass}`}>
        {displayScore}
      </span>
    </div>
  );
};

export default React.memo(SiqsScoreBadge);

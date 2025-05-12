
import React from 'react';
import { Star } from "lucide-react";
import { formatSiqsForDisplay, getSiqsScore } from '@/utils/siqsHelpers';

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
  // Extract numeric score from any score format
  const numericScore = score !== null ? getSiqsScore(score) : null;
  
  // Format score for display
  const displayScore = formatSiqsForDisplay(numericScore);
  
  // Get color class based on score value
  const getColorClass = (scoreValue: number | null) => {
    if (scoreValue === null) return 'text-muted-foreground';
    if (scoreValue >= 8) return 'text-green-500';
    if (scoreValue >= 6) return 'text-yellow-400';
    if (scoreValue >= 4) return 'text-amber-500';
    if (scoreValue >= 2) return 'text-orange-500';
    return 'text-red-500';
  };
  
  const colorClass = getColorClass(numericScore);
  const showCertificationStar = isCertified || forceCertified;
  
  // Show loading skeleton if loading
  if (loading) {
    return (
      <div className={`flex items-center ${compact ? 'h-5' : 'h-6'} ${className}`}>
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
          className={`h-3.5 w-3.5 ${isCertified ? 'text-yellow-400 fill-yellow-400' : 'text-muted'}`} 
        />
      )}
      <span className={`${compact ? 'text-sm' : 'text-base'} font-medium ${colorClass}`}>
        {displayScore}
      </span>
    </div>
  );
};

export default SiqsScoreBadge;


import React from 'react';
import { normalizeToSiqsScale, getSiqsScore } from '@/utils/siqsHelpers';

interface SiqsScoreBadgeProps {
  score: number | null | { score: number; isViable: boolean } | any;
  compact?: boolean;
  loading?: boolean;
  isCertified?: boolean;
  forceCertified?: boolean;
  confidenceScore?: number;
}

const SiqsScoreBadge: React.FC<SiqsScoreBadgeProps> = ({
  score,
  compact = false,
  loading = false,
  isCertified = false,
  forceCertified = false,
  confidenceScore = 10
}) => {
  // Get normalized numeric value from any score format
  const numericScore = score !== null ? getSiqsScore(score) : null;
  
  // Get style classes based on score
  const getScoreClass = (score: number | null): string => {
    if (score === null) return 'bg-gray-400/50';
    if (score >= 8) return 'bg-green-500/90 text-white';
    if (score >= 6) return 'bg-green-400/80 text-gray-800';
    if (score >= 4) return 'bg-yellow-400/90 text-gray-800';
    if (score >= 2) return 'bg-orange-400/90 text-white';
    return 'bg-red-500/90 text-white';
  };
  
  // Format score for display
  const getScoreDisplay = (score: number | null): string => {
    if (score === null) return 'N/A';
    return score.toFixed(1);
  };
  
  // Handle certified status style
  const certifiedClass = (isCertified || forceCertified) ? 
    'border-2 border-blue-400/60' : '';
    
  // Handle confidence indicator - only show for non-null scores
  const confidenceIndicator = numericScore !== null && confidenceScore < 8 ? 
    <div className="absolute -right-1 -top-1 w-2 h-2 bg-yellow-400 rounded-full"></div> : null;
  
  if (loading) {
    // Loading state
    return (
      <div className={`relative inline-flex items-center justify-center ${compact ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'} bg-gray-200/70 text-gray-500 font-medium rounded ${certifiedClass} animate-pulse`}>
        <div className="w-4 h-4 rounded-full bg-gray-400/50 animate-pulse mr-1"></div>
        <span>{compact ? '...' : 'Loading...'}</span>
      </div>
    );
  }
  
  return (
    <div className={`relative inline-flex items-center justify-center ${compact ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'} ${getScoreClass(numericScore)} font-medium rounded ${certifiedClass}`}>
      {confidenceIndicator}
      <span>SIQS {getScoreDisplay(numericScore)}</span>
    </div>
  );
};

export default React.memo(SiqsScoreBadge);

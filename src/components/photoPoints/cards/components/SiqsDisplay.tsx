
import React from 'react';
import { useMemo } from 'react';
import SiqsScoreBadge from '../SiqsScoreBadge';
import { normalizeToSiqsScale } from '@/utils/siqsHelpers';

interface SiqsDisplayProps {
  realTimeSiqs: number | null;
  loadingSiqs: boolean;
  hasAttemptedLoad: boolean;
  isVisible: boolean;
  isCertified: boolean;
  siqsConfidence: number;
  locationSiqs?: number;
}

const SiqsDisplay: React.FC<SiqsDisplayProps> = ({
  realTimeSiqs,
  loadingSiqs,
  hasAttemptedLoad,
  isVisible,
  isCertified,
  siqsConfidence,
  locationSiqs
}) => {
  // Only show loading state when absolutely necessary
  const showLoadingState = useMemo(() => {
    // Never show loading state if we already have a score
    if (realTimeSiqs !== null && realTimeSiqs > 0) {
      return false;
    }
    if (locationSiqs && locationSiqs > 0) {
      return false;
    }
    // Only show loading for certified locations or explicitly visible ones
    return (isCertified || isVisible) && loadingSiqs && !hasAttemptedLoad;
  }, [isCertified, loadingSiqs, isVisible, realTimeSiqs, locationSiqs, hasAttemptedLoad]);
  
  // Use the best available score, normalized to 0-10 scale
  const displayScore = useMemo(() => {
    // First priority: real-time SIQS if available
    if (realTimeSiqs !== null && realTimeSiqs > 0) {
      return normalizeToSiqsScale(realTimeSiqs);
    }
    
    // Second priority: stored location SIQS if available
    if (locationSiqs && locationSiqs > 0) {
      return normalizeToSiqsScale(locationSiqs);
    }
    
    // No score available
    return null;
  }, [realTimeSiqs, locationSiqs]);
  
  // Calculate confidence level for display
  const confidenceLevel = useMemo(() => {
    // Higher confidence for real-time SIQS
    if (realTimeSiqs !== null && realTimeSiqs > 0) {
      return siqsConfidence;
    }
    
    // Lower confidence for stored SIQS
    if (locationSiqs && locationSiqs > 0) {
      return isCertified ? 9 : 7;
    }
    
    return 5;
  }, [realTimeSiqs, locationSiqs, siqsConfidence, isCertified]);

  return (
    <SiqsScoreBadge 
      score={displayScore}
      compact={true}
      isCertified={isCertified}
      loading={showLoadingState}
      forceCertified={false}
      confidenceScore={confidenceLevel}
    />
  );
};

export default React.memo(SiqsDisplay);

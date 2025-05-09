
import React, { useMemo } from 'react';
import SiqsScoreBadge from '../SiqsScoreBadge';

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
  // Optimize loading state logic for mobile
  const showLoadingState = useMemo(() => {
    // Only show minimum loading indicators on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      // Mobile: only show loading for certified locations with no score
      if (realTimeSiqs !== null && realTimeSiqs > 0) return false;
      if (locationSiqs && locationSiqs > 0) return false;
      return isCertified && isVisible && !hasAttemptedLoad;
    } else {
      // Desktop: original behavior
      if (realTimeSiqs !== null && realTimeSiqs > 0) return false;
      if (locationSiqs && locationSiqs > 0) return false;
      return isCertified && isVisible && loadingSiqs;
    }
  }, [isCertified, loadingSiqs, isVisible, realTimeSiqs, locationSiqs, hasAttemptedLoad]);
  
  // Choose the best score to display with priority ordering
  const displayScore = useMemo(() => {
    if (realTimeSiqs !== null && realTimeSiqs > 0) {
      return realTimeSiqs;
    }
    if (locationSiqs && locationSiqs > 0) {
      return locationSiqs;
    }
    if (isCertified) {
      return locationSiqs && locationSiqs > 0 ? locationSiqs : null;
    }
    return null;
  }, [realTimeSiqs, locationSiqs, isCertified]);

  return (
    <SiqsScoreBadge 
      score={displayScore}
      compact={true}
      isCertified={isCertified}
      loading={showLoadingState}
      forceCertified={false}
      confidenceScore={siqsConfidence}
    />
  );
};

export default React.memo(SiqsDisplay);

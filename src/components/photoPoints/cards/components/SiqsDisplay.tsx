
import React from 'react';
import { useMemo } from 'react';
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
  // Only show loading state when absolutely necessary
  const showLoadingState = useMemo(() => {
    // Never show loading state if we already have a score
    if (realTimeSiqs !== null && realTimeSiqs > 0) {
      return false;
    }
    if (locationSiqs && locationSiqs > 0) {
      return false;
    }
    // Only show loading for certified locations when no score is available
    return isCertified && isVisible && loadingSiqs;
  }, [isCertified, loadingSiqs, isVisible, realTimeSiqs, locationSiqs]);
  
  // Use the best available score
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

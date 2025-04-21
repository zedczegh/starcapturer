
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
    // Don't show loading if we already have a score
    if (realTimeSiqs !== null && realTimeSiqs > 0) return false;
    if (locationSiqs && locationSiqs > 0) return false;
    
    // Show loading when we're fetching data
    return (isCertified || locationSiqs !== undefined) && isVisible && loadingSiqs;
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

  // Always show badge for locations with locationSiqs defined, even if zero
  const forceDisplay = locationSiqs !== undefined || isCertified;

  return (
    <SiqsScoreBadge 
      score={displayScore}
      compact={true}
      isCertified={isCertified}
      loading={showLoadingState}
      forceCertified={forceDisplay}
      confidenceScore={siqsConfidence}
    />
  );
};

export default React.memo(SiqsDisplay);

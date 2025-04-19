
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
  const showLoadingState = useMemo(() => {
    // Show loading for certified locations that haven't completed loading yet
    if (!hasAttemptedLoad && isCertified && isVisible) {
      return true;
    }
    return loadingSiqs;
  }, [isCertified, loadingSiqs, hasAttemptedLoad, isVisible]);
  
  const displayScore = useMemo(() => {
    // Use real-time SIQS if available
    if (realTimeSiqs !== null && realTimeSiqs > 0) {
      return realTimeSiqs;
    }
    
    // Use location SIQS as fallback
    if (locationSiqs && locationSiqs > 0) {
      return locationSiqs;
    }
    
    // For certified locations, always show something (default or loading)
    if (isCertified) {
      return showLoadingState ? null : 5.0;
    }
    
    // For regular locations with no score, show nothing
    return null;
  }, [realTimeSiqs, locationSiqs, isCertified, showLoadingState]);

  return (
    <SiqsScoreBadge 
      score={displayScore}
      compact={true}
      isCertified={isCertified}
      loading={showLoadingState}
      forceCertified={isCertified && !displayScore && !showLoadingState}
      confidenceScore={siqsConfidence}
    />
  );
};

export default React.memo(SiqsDisplay);

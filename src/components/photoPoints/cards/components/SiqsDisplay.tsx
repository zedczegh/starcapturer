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
    if (!hasAttemptedLoad && isCertified && isVisible && !realTimeSiqs) {
      return true;
    }
    return loadingSiqs && !realTimeSiqs;
  }, [isCertified, loadingSiqs, hasAttemptedLoad, isVisible, realTimeSiqs]);
  
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

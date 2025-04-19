
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
    if (!hasAttemptedLoad && isCertified && isVisible) {
      return true;
    }
    return loadingSiqs;
  }, [isCertified, loadingSiqs, hasAttemptedLoad, isVisible]);
  
  const displayScore = useMemo(() => {
    if (realTimeSiqs !== null && realTimeSiqs > 0) {
      return realTimeSiqs;
    }
    return locationSiqs && locationSiqs > 0 ? locationSiqs : null;
  }, [realTimeSiqs, locationSiqs]);

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

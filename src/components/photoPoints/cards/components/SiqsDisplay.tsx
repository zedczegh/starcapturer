
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
    
    // Show loading when we're fetching data and this location should have a score
    return (isCertified || locationSiqs !== undefined) && isVisible && loadingSiqs;
  }, [isCertified, loadingSiqs, isVisible, realTimeSiqs, locationSiqs]);
  
  // Use the best available score
  const displayScore = useMemo(() => {
    // For collections and certified locations, prioritize real-time SIQS
    if (realTimeSiqs !== null && realTimeSiqs > 0) {
      return realTimeSiqs;
    }
    
    // Fall back to location SIQS if available
    if (locationSiqs && locationSiqs > 0) {
      return locationSiqs;
    }
    
    // If certified or in collections, ensure we show a badge even if we don't have a score yet
    if (isCertified) {
      return locationSiqs && locationSiqs > 0 ? locationSiqs : null;
    }
    
    return null;
  }, [realTimeSiqs, locationSiqs, isCertified]);

  // Always show badge for locations with locationSiqs defined or if certified
  const forceDisplay = locationSiqs !== undefined || isCertified;

  // Debug logging for collections view
  React.useEffect(() => {
    if (isCertified) {
      console.log(`SiqsDisplay: realTimeSiqs=${realTimeSiqs}, locationSiqs=${locationSiqs}, displayScore=${displayScore}, loading=${showLoadingState}`);
    }
  }, [realTimeSiqs, locationSiqs, displayScore, showLoadingState, isCertified]);

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

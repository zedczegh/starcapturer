import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import SiqsScoreBadge from '@/components/photoPoints/cards/SiqsScoreBadge';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSiqsState } from '@/hooks/photoPoints/useSiqsState';

interface SiqsDisplayProps {
  realTimeSiqs: number | null;
  loadingSiqs: boolean;
  hasAttemptedLoad: boolean;
  isVisible: boolean;
  isCertified: boolean;
  siqsConfidence: number;
  locationSiqs: number | null;
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
  const isMobile = useIsMobile();
  const { displaySiqs, stableSiqs } = useSiqsState({
    realTimeSiqs,
    locationSiqs
  });
  
  // Memoize the score to display to prevent unnecessary re-renders
  const scoreToShow = React.useMemo(() => {
    if (loadingSiqs && stableSiqs) {
      // If loading but we have stable data, use that
      return stableSiqs;
    } else if (displaySiqs) {
      // Otherwise use the current display score
      return displaySiqs;
    }
    // No score to show
    return null;
  }, [loadingSiqs, stableSiqs, displaySiqs]);
  
  // If we're loading and have previous stable data, keep showing it
  if (loadingSiqs && stableSiqs) {
    return (
      <div className="flex items-center">
        {isCertified ? (
          <div className="flex items-center">
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground mr-1" />
            <SiqsScoreBadge score={stableSiqs} confidenceScore={siqsConfidence} />
          </div>
        ) : (
          <SiqsScoreBadge score={stableSiqs} confidenceScore={siqsConfidence} />
        )}
      </div>
    );
  }
  
  // If we have real-time data or stable data, show it
  if (scoreToShow) {
    return <SiqsScoreBadge score={scoreToShow} confidenceScore={siqsConfidence} />;
  }
  
  // If we're loading and don't have previous data
  if (loadingSiqs) {
    return (
      <div className="flex items-center">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground mr-1" />
        <span className="text-xs text-muted-foreground">SIQS</span>
      </div>
    );
  }
  
  // If we've attempted to load but got no data
  if (hasAttemptedLoad && isVisible) {
    return <span className="text-xs text-muted-foreground">No SIQS data</span>;
  }
  
  // Default state - not loaded yet
  return <span className="text-xs text-muted-foreground">SIQS</span>;
};

export default React.memo(SiqsDisplay);

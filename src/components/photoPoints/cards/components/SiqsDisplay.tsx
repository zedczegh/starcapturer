
import React, { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import SiqsScoreBadge from '@/components/photoPoints/cards/SiqsScoreBadge';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [stableSiqs, setStableSiqs] = useState<number | null>(null);
  const [displaySiqs, setDisplaySiqs] = useState<number | null>(locationSiqs);
  const [updateTime, setUpdateTime] = useState<number>(Date.now());
  
  // Always prioritize existing SIQS data if available to prevent flickering
  useEffect(() => {
    if (locationSiqs && locationSiqs > 0) {
      setDisplaySiqs(locationSiqs);
      setStableSiqs(locationSiqs);
    }
  }, [locationSiqs]);
  
  // Update stable SIQS when real-time data is available, with debounce
  useEffect(() => {
    if (realTimeSiqs !== null && realTimeSiqs > 0) {
      setStableSiqs(realTimeSiqs);
      
      // Only update display SIQS if it's significantly different to prevent flickering
      // Also add a time-based throttle to prevent rapid updates
      const now = Date.now();
      if ((!displaySiqs || Math.abs(realTimeSiqs - displaySiqs) > 0.5) && 
          (now - updateTime > 2000)) {  // 2 second throttle
        setDisplaySiqs(realTimeSiqs);
        setUpdateTime(now);
      }
    }
  }, [realTimeSiqs, displaySiqs, updateTime]);

  // Memoize the score to display to prevent unnecessary re-renders
  const scoreToShow = useMemo(() => {
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

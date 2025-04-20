import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import SiqsBadge from '@/components/siqs/SiqsBadge';
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
  
  // Always prioritize existing SIQS data if available to prevent flickering
  useEffect(() => {
    if (locationSiqs && locationSiqs > 0) {
      setDisplaySiqs(locationSiqs);
      setStableSiqs(locationSiqs);
    }
  }, [locationSiqs]);
  
  // Update stable SIQS when real-time data is available
  useEffect(() => {
    if (realTimeSiqs !== null && realTimeSiqs > 0) {
      setStableSiqs(realTimeSiqs);
      // Only update display SIQS if it's significantly different to prevent flickering
      if (!displaySiqs || Math.abs(realTimeSiqs - displaySiqs) > 0.5) {
        setDisplaySiqs(realTimeSiqs);
      }
    }
  }, [realTimeSiqs, displaySiqs]);
  
  // If we're loading and have previous stable data, keep showing it
  if (loadingSiqs && stableSiqs) {
    return (
      <div className="flex items-center">
        {isCertified ? (
          <div className="flex items-center">
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground mr-1" />
            <SiqsBadge score={stableSiqs} confidence={siqsConfidence} />
          </div>
        ) : (
          <SiqsBadge score={stableSiqs} confidence={siqsConfidence} />
        )}
      </div>
    );
  }
  
  // If we have real-time data or stable data, show it
  if (displaySiqs) {
    return <SiqsBadge score={displaySiqs} confidence={siqsConfidence} />;
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

export default SiqsDisplay;

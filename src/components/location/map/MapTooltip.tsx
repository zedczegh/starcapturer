
import React, { useState, useEffect, useCallback } from 'react';
import { Popup } from 'react-leaflet';
import SiqsScoreBadge from '../../photoPoints/cards/SiqsScoreBadge';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { hasCachedSiqs, getCachedSiqs, setSiqsCache } from '@/services/realTimeSiqs/siqsCache';

interface MapTooltipProps {
  name: string;
  latitude: number;
  longitude: number;
  isDarkSkyReserve?: boolean;
  certification?: string;
  siqs?: number;
}

const MapTooltip: React.FC<MapTooltipProps> = ({
  name,
  latitude,
  longitude,
  isDarkSkyReserve = false,
  certification = '',
  siqs
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingSiqs, setLoadingSiqs] = useState(false);
  const [localSiqs, setLocalSiqs] = useState<number | null>(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);
  
  // Format coordinates for display
  const formattedLat = latitude.toFixed(6);
  const formattedLng = longitude.toFixed(6);

  // Check if this is a certified location
  const isCertified = Boolean(isDarkSkyReserve || certification);
  
  // Get numeric SIQS score using our helper
  const siqsScore = getSiqsScore(siqs);
  
  // Function to fetch SIQS data
  const fetchSiqsData = useCallback(async () => {
    if (!latitude || !longitude || !isFinite(latitude) || !isFinite(longitude)) {
      console.warn('Invalid coordinates for SIQS fetch', { latitude, longitude });
      return;
    }
    
    // Only fetch if we don't already have SIQS data
    if (localSiqs !== null || loadingSiqs) return;
    
    setLoadingSiqs(true);
    setFetchAttempted(true);
    
    try {
      console.log(`Fetching SIQS for tooltip: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      
      // Check cache first
      if (hasCachedSiqs(latitude, longitude)) {
        const cachedData = getCachedSiqs(latitude, longitude);
        if (cachedData) {
          console.log('Using cached SIQS data for tooltip');
          setLocalSiqs(cachedData.siqs);
          setLoadingSiqs(false);
          return;
        }
      }
      
      // Set Bortle scale based on whether this is a certified location
      const effectiveBortleScale = isCertified ? 3 : 5;
      
      // Calculate SIQS
      const result = await calculateRealTimeSiqs(latitude, longitude, effectiveBortleScale);
      
      if (result && result.siqs > 0) {
        console.log(`SIQS result for tooltip: ${result.siqs}`);
        setLocalSiqs(result.siqs);
        
        // Cache the result
        setSiqsCache(latitude, longitude, result);
      } else {
        // If calculation failed but this is a certified location, use a default high score
        if (isCertified) {
          const defaultScore = isDarkSkyReserve ? 7.5 : 6.8;
          console.log(`Using default SIQS for certified location: ${defaultScore}`);
          setLocalSiqs(defaultScore);
        } else {
          setLocalSiqs(0);
        }
      }
    } catch (error) {
      console.error("Error calculating SIQS for tooltip:", error);
      // For certified locations, use fallback values even on error
      if (isCertified) {
        setLocalSiqs(isDarkSkyReserve ? 7.2 : 6.5);
      }
    } finally {
      setLoadingSiqs(false);
    }
  }, [latitude, longitude, localSiqs, loadingSiqs, isCertified, isDarkSkyReserve]);
  
  // Effect to handle tooltip open/close
  useEffect(() => {
    if (isOpen && !fetchAttempted && (isCertified || siqsScore > 0)) {
      fetchSiqsData();
    }
  }, [isOpen, isCertified, siqsScore, fetchAttempted, fetchSiqsData]);
  
  // Handle popup open
  const handlePopupOpen = () => {
    setIsOpen(true);
  };
  
  // Handle popup close
  const handlePopupClose = () => {
    setIsOpen(false);
  };
  
  // Determine which SIQS value to display
  // Priority: localSiqs (real-time) > siqs (passed in) > default for certified
  const displaySiqs = localSiqs !== null ? localSiqs : siqsScore;
  const showSiqs = loadingSiqs || displaySiqs > 0 || isCertified;

  return (
    <Popup 
      closeOnClick={false} 
      autoClose={false}
    >
      <div
        className="min-w-[200px] py-1"
        onMouseEnter={handlePopupOpen}
        onMouseLeave={handlePopupClose}
      >
        <div className="font-medium text-base mb-1">{name}</div>
        <div className="text-xs text-muted-foreground mb-2">
          {formattedLat}, {formattedLng}
        </div>
        
        {showSiqs && (
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-muted-foreground">
              {isCertified && certification ? (
                `${certification}`
              ) : isDarkSkyReserve ? (
                'Dark Sky Reserve'
              ) : ''}
            </div>
            <div>
              <SiqsScoreBadge 
                score={displaySiqs} 
                loading={loadingSiqs} 
                compact={true}
                isCertified={isCertified}
              />
            </div>
          </div>
        )}
      </div>
    </Popup>
  );
};

export default MapTooltip;

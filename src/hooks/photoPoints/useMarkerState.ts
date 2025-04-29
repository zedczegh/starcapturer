
import { useState, useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { getCertifiedLocationIcon, getCalculatedLocationIcon, getDarkSkyLocationIcon } from '@/components/photoPoints/map/MarkerUtils';

// Interface for useMarkerState hook
interface MarkerStateParams {
  location: SharedAstroSpot;
  realTimeSiqs: number | null;
  isCertified: boolean;
  isHovered: boolean;
}

// Returns marker state properties for use in the LocationMarker component
export const useMarkerState = ({
  location,
  realTimeSiqs,
  isCertified,
  isHovered
}: MarkerStateParams) => {
  // Derive the SIQS score from the location or realtime data
  const siqsScore = realTimeSiqs !== null ? realTimeSiqs : getSiqsScore(location.siqs);
  
  // Format location name for display
  const displayName = location.name || 
    (location.displayName || 
      `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
  
  // Get the appropriate icon based on location type
  const icon = isCertified 
    ? location.isDarkSkyReserve 
      ? getDarkSkyLocationIcon(isHovered)
      : getCertifiedLocationIcon(isHovered)
    : getCalculatedLocationIcon(isHovered);
  
  return {
    siqsScore,
    displayName,
    icon
  };
};


import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getProgressColor } from '@/components/siqs/utils/progressColor';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import { getSiqsClass, getCertificationColor } from '@/utils/markerUtils';

/**
 * Creates a marker icon based on location type and device
 */
export const getLocationMarker = (
  location: SharedAstroSpot, 
  isCertified: boolean, 
  isMobile: boolean
) => {
  const sizeMultiplier = isMobile ? 1.2 : 1.0;
  
  if (isCertified) {
    const certColor = getCertificationColor(location);
    return createCustomMarker(certColor, 'star', sizeMultiplier);
  } else {
    const defaultColor = '#4ADE80';
    const color = location.siqs ? getProgressColor(location.siqs) : defaultColor;
    return createCustomMarker(color, 'circle', sizeMultiplier);
  }
};

/**
 * Get CSS class based on SIQS score for styling popup
 */
export const getMarkerSiqsClass = (siqs?: number) => {
  return getSiqsClass(siqs);
};

/**
 * Creates a unique location ID from coordinates if no ID exists
 */
export const getLocationId = (location: SharedAstroSpot): string => {
  return location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
};

/**
 * Get displayable name based on language preference
 */
export const getDisplayName = (location: SharedAstroSpot, language: string): string => {
  return language === 'zh' && location.chineseName 
    ? location.chineseName 
    : location.name;
};

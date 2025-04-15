
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import { getProgressColor } from '@/components/siqs/utils/progressColor';
import { getCertificationColor } from '@/utils/markerUtils';

/**
 * Get marker icon for a location
 */
export const getLocationMarker = (location: SharedAstroSpot, isCertified: boolean, isHovered: boolean, isMobile: boolean) => {
  const sizeMultiplier = isMobile ? 1.2 : 1.0;
  
  if (isCertified) {
    // Use the marker utils function to get the correct certification color
    const certColor = getCertificationColor(location);
    return createCustomMarker(certColor, 'star', sizeMultiplier);
  } else {
    const defaultColor = '#4ADE80'; // Bright green fallback
    const color = location.siqs ? getProgressColor(location.siqs) : defaultColor;
    return createCustomMarker(color, 'circle', sizeMultiplier);
  }
};

/**
 * Create user location marker
 */
export const createUserMarker = (isMobile: boolean) => {
  return createCustomMarker('#e11d48', undefined, isMobile ? 1.2 : 1.0);
};

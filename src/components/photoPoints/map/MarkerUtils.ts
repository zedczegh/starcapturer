
/**
 * Utilities for handling map markers
 */
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { isWaterLocation } from '@/utils/locationValidator';
import { isCertifiedLocation } from '@/utils/locationFiltering';
import { getProgressColor } from '@/components/siqs/utils/progressColor';

/**
 * Get marker color based on location certification type
 */
export const getCertificationColor = (location: SharedAstroSpot): string => {
  if (!isCertifiedLocation(location)) {
    return 'rgba(74, 222, 128, 0.85)'; // Default green with transparency
  }
  
  const certification = (location.certification || '').toLowerCase();
  
  if (certification.includes('community')) {
    return 'rgba(255, 215, 0, 0.85)'; // Gold for Dark Sky Community
  } else if (certification.includes('reserve') || certification.includes('sanctuary') || location.isDarkSkyReserve) {
    return 'rgba(155, 135, 245, 0.85)'; // Purple for reserves
  } else if (certification.includes('park')) {
    return 'rgba(74, 222, 128, 0.85)'; // Green for Dark Sky Park
  } else if (certification.includes('urban') || certification.includes('night sky place')) {
    return 'rgba(30, 174, 219, 0.85)'; // Blue for Urban Night Sky
  } else if (certification.includes('lodging')) {
    return 'rgba(0, 0, 128, 0.85)'; // Navy blue for Dark Sky Lodging
  } else {
    return 'rgba(155, 135, 245, 0.85)'; // Default to reserve color
  }
};

/**
 * Get CSS class for SIQS quality level
 */
export const getSiqsClass = (siqs?: number | null | { score: number; isViable: boolean }): string => {
  if (siqs === undefined || siqs === null) return '';
  
  // Use our enhanced getSiqsScore utility if the input is not already a number
  const score = typeof siqs === 'number' ? siqs : getSiqsScore(siqs);
  
  if (score === 0) return '';
  if (score >= 7.5) return 'siqs-excellent';
  if (score >= 5.5) return 'siqs-good';
  return 'siqs-poor';
};

/**
 * Determine if a location is a water spot (for filtering)
 */
export const isWaterSpot = (location: SharedAstroSpot): boolean => {
  // Never filter out certified locations
  if (isCertifiedLocation(location)) {
    return false;
  }
  
  // Use enhanced water detection
  return isWaterLocation(location.latitude, location.longitude);
};

/**
 * Get marker color based on location type and SIQS score
 */
export const getLocationColor = (location: SharedAstroSpot): string => {
  if (isCertifiedLocation(location)) {
    return getCertificationColor(location);
  } else {
    const defaultColor = '#4ADE80'; // Bright green fallback
    return location.siqs ? getProgressColor(getSiqsScore(location.siqs)) : defaultColor;
  }
};

/**
 * Determine if a location should be shown based on the active view
 */
export const shouldShowLocationMarker = (
  location: SharedAstroSpot, 
  isCertified: boolean,
  activeView: 'certified' | 'calculated'
): boolean => {
  // Skip rendering calculated locations in certified view
  if (activeView === 'certified' && !isCertified) {
    return false;
  }
  
  // Skip water locations for calculated spots (never skip certified)
  if (!isCertified && isWaterSpot(location)) {
    return false;
  }
  
  return true;
};


/**
 * Map marker utilities
 * IMPORTANT: This file contains critical marker creation and styling logic.
 */
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { isWaterLocation } from "@/utils/locationValidator";
import { getProgressColor } from "@/components/siqs/utils/progressColor";
import { getSiqsScore } from "@/utils/siqsHelpers";

/**
 * Get SIQS quality class for styling
 * @param siqs SIQS score
 * @returns CSS class name based on SIQS quality
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
 * Determines if a location is a water spot (for filtering)
 * @param location Location to check
 * @returns boolean indicating if location is a water spot
 */
export const isWaterSpot = (location: SharedAstroSpot): boolean => {
  // Never filter out certified locations
  if (location.isDarkSkyReserve || location.certification) {
    return false;
  }
  
  // Use enhanced water detection
  return isWaterLocation(
    location.latitude, 
    location.longitude, 
    Boolean(location.isDarkSkyReserve || location.certification)
  );
};

/**
 * Get certification type based color for markers
 * @param location Location to get color for
 * @returns RGBA color string with transparency
 */
export const getCertificationColor = (location: SharedAstroSpot): string => {
  if (!location.isDarkSkyReserve && !location.certification) {
    return 'rgba(74, 222, 128, 0.85)'; // Default green with transparency
  }
  
  const certification = (location.certification || '').toLowerCase();
  
  // IMPORTANT: Ensure communities use gold/yellow color
  if (certification.includes('community')) {
    return 'rgba(255, 215, 0, 0.85)'; // Gold for Dark Sky Community #FFD700
  } else if (certification.includes('reserve') || certification.includes('sanctuary') || location.isDarkSkyReserve) {
    return 'rgba(155, 135, 245, 0.85)'; // Purple for reserves #9b87f5
  } else if (certification.includes('park')) {
    return 'rgba(74, 222, 128, 0.85)'; // Green for Dark Sky Park #4ADE80
  } else if (certification.includes('urban') || certification.includes('night sky place')) {
    return 'rgba(30, 174, 219, 0.85)'; // Blue for Urban Night Sky #1EAEDB
  } else if (certification.includes('lodging')) {
    return 'rgba(0, 0, 128, 0.85)'; // Navy blue for Dark Sky Lodging
  } else {
    return 'rgba(155, 135, 245, 0.85)'; // Default to reserve color
  }
};

/**
 * Determine if a location should be shown based on the active view
 * @param location Location to check
 * @param isCertified Whether location is certified
 * @param activeView Current active view
 * @returns boolean indicating if location should be shown
 */
export const shouldShowLocationMarker = (
  location: SharedAstroSpot, 
  isCertified: boolean,
  activeView: 'certified' | 'calculated'
): boolean => {
  // IMPORTANT: Skip rendering calculated locations in certified view
  if (activeView === 'certified' && !isCertified) {
    return false;
  }
  
  // Skip water locations for calculated spots (never skip certified)
  if (!isCertified && isWaterSpot(location)) {
    return false;
  }
  
  return true;
};

/**
 * Get marker color based on location type and SIQS score
 * @param location Location to get color for
 * @returns Hex color string
 */
export const getLocationColor = (location: SharedAstroSpot): string => {
  if (location.isDarkSkyReserve || location.certification) {
    return getCertificationColor(location);
  } else {
    const defaultColor = '#4ADE80'; // Bright green fallback
    return location.siqs ? getProgressColor(getSiqsScore(location.siqs)) : defaultColor;
  }
};

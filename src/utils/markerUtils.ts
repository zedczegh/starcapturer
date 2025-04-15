
/**
 * Map marker utilities
 * IMPORTANT: This file contains critical marker creation and styling logic.
 * Any changes should be carefully tested to avoid breaking the map functionality.
 */
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { isWaterLocation } from "@/utils/locationValidator";
import { getProgressColor } from "@/components/siqs/utils/progressColor";

/**
 * Get SIQS quality class for styling
 * @param siqs SIQS score
 * @returns CSS class name based on SIQS quality
 */
export const getSiqsClass = (siqs?: number): string => {
  if (!siqs) return '';
  if (siqs >= 7.5) return 'siqs-excellent';
  if (siqs >= 5.5) return 'siqs-good';
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
 * @returns Hex color string
 */
export const getCertificationColor = (location: SharedAstroSpot): string => {
  if (!location.isDarkSkyReserve && !location.certification) {
    return '#FFD700'; // Default gold
  }
  
  const certification = (location.certification || '').toLowerCase();
  
  // Check for different certification types with comprehensive checks
  if (certification.includes('lodging')) {
    return '#1e3a8a'; // Navy blue for lodgings
  } else if (certification.includes('reserve') || certification.includes('sanctuary') || Boolean(location.isDarkSkyReserve)) {
    return '#9b87f5'; // Purple for reserves
  } else if (certification.includes('park')) {
    return '#4ADE80'; // Green for parks
  } else if (certification.includes('community')) {
    return '#FFA500'; // Orange for communities
  } else if (certification.includes('urban')) {
    return '#0EA5E9'; // Blue for urban night skies
  } else {
    return '#FFD700'; // Gold for generic certified locations
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
    return location.siqs ? getProgressColor(location.siqs) : defaultColor;
  }
};

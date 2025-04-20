
/**
 * Location filtering utilities
 * IMPORTANT: This file contains critical filtering logic for map locations.
 * Any changes to these functions should be carefully tested to avoid breaking the app.
 */
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { isWaterLocation } from "@/utils/locationValidator";

/**
 * Filter out invalid locations and water spots
 * @param locations Array of locations to filter
 * @returns Filtered locations array
 */
export const filterValidLocations = (locations: SharedAstroSpot[]): SharedAstroSpot[] => {
  return locations.filter(location => 
    location && 
    typeof location.latitude === 'number' && 
    typeof location.longitude === 'number' &&
    // Filter out water locations for calculated spots, never filter certified
    (location.isDarkSkyReserve || 
     location.certification || 
     !isWaterLocation(location.latitude, location.longitude, false))
  );
};

/**
 * Extract certified and calculated locations
 * @param locations Array of locations to separate
 * @returns Object with certified and calculated location arrays
 */
export const separateLocationTypes = (locations: SharedAstroSpot[]) => {
  const certifiedLocations = locations.filter(location => 
    location.isDarkSkyReserve === true || 
    (location.certification && location.certification !== '')
  );
  
  const calculatedLocations = locations.filter(location => 
    !(location.isDarkSkyReserve === true || 
    (location.certification && location.certification !== ''))
  );

  return { certifiedLocations, calculatedLocations };
};

/**
 * Merge locations according to active view
 * @param certifiedLocations Array of certified locations
 * @param calculatedLocations Array of calculated locations
 * @param activeView Current active view mode
 * @returns Merged array of locations based on view
 */
export const mergeLocations = (
  certifiedLocations: SharedAstroSpot[], 
  calculatedLocations: SharedAstroSpot[],
  activeView: 'certified' | 'calculated'
) => {
  // For certified view, ONLY include certified locations
  if (activeView === 'certified') {
    return certifiedLocations;
  }
  
  // For calculated view, include both types but prioritize certified locations
  const locationMap = new Map<string, SharedAstroSpot>();
  
  // Always include all certified locations regardless of active view
  certifiedLocations.forEach(loc => {
    if (loc.latitude && loc.longitude) {
      const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
      locationMap.set(key, loc);
    }
  });
  
  // Add calculated locations
  calculatedLocations.forEach(loc => {
    // Skip water locations for calculated spots
    if (loc.latitude && loc.longitude && !isWaterLocation(loc.latitude, loc.longitude)) {
      const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
      const existing = locationMap.get(key);
      if (!existing || (loc.siqs && (!existing.siqs || loc.siqs > existing.siqs))) {
        locationMap.set(key, loc);
      }
    }
  });
  
  return Array.from(locationMap.values());
};

/**
 * Check if a location is certified
 * @param location Location to check
 * @returns boolean indicating if location is certified
 */
export const isCertifiedLocation = (location: SharedAstroSpot): boolean => {
  return location.isDarkSkyReserve === true || 
    (location.certification && location.certification !== '');
};

/**
 * Check if a location should be shown based on active view
 * @param location Location to check
 * @param activeView Current active view mode
 * @returns boolean indicating if location should be shown
 */
export const shouldShowLocation = (
  location: SharedAstroSpot, 
  activeView: 'certified' | 'calculated'
): boolean => {
  // In certified view, only show certified locations
  if (activeView === 'certified') {
    return isCertifiedLocation(location);
  }
  
  // In calculated view, show all locations
  return true;
};

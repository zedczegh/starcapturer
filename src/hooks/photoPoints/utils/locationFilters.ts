
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation } from '@/utils/locationValidator';
import { calculateDistance } from '@/utils/geoUtils';

/**
 * Filter out invalid locations and water spots
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
 * Extract certified and calculated locations from a list
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
 */
export const mergeLocations = (
  certifiedLocations: SharedAstroSpot[], 
  calculatedLocations: SharedAstroSpot[],
  activeView: 'certified' | 'calculated'
): SharedAstroSpot[] => {
  const locationMap = new Map<string, SharedAstroSpot>();
  
  // Always include all certified locations regardless of active view
  certifiedLocations.forEach(loc => {
    if (loc.latitude && loc.longitude) {
      const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
      locationMap.set(key, loc);
    }
  });
  
  // Add calculated locations only if in calculated view
  if (activeView === 'calculated') {
    calculatedLocations.forEach(loc => {
      // Skip water locations for calculated spots
      if (loc.latitude && loc.longitude && 
          !isWaterLocation(loc.latitude, loc.longitude)) {
        const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        const existing = locationMap.get(key);
        if (!existing || (loc.siqs && (!existing.siqs || loc.siqs > existing.siqs))) {
          locationMap.set(key, loc);
        }
      }
    });
  }
  
  return Array.from(locationMap.values());
};

/**
 * Apply minimum distance filter between locations to prevent clustering
 */
export const applyMinDistanceFilter = (
  locations: SharedAstroSpot[], 
  minDistance = 3 // Minimum distance in kilometers
): SharedAstroSpot[] => {
  const result: SharedAstroSpot[] = [];
  const { certifiedLocations, calculatedLocations } = separateLocationTypes(locations);
  
  // Always include all certified locations
  result.push(...certifiedLocations);
  
  // For calculated locations, ensure minimum distance between points
  if (calculatedLocations.length > 0) {
    // Sort by quality (SIQS) first, then by distance if SIQS is the same
    const sortedCalculatedLocations = [...calculatedLocations].sort((a, b) => {
      // First compare by SIQS score
      const siqsComparison = (b.siqs || 0) - (a.siqs || 0);
      
      // If SIQS scores are equal (or within 1 point), sort by distance
      if (Math.abs(siqsComparison) <= 1) {
        return (a.distance || Infinity) - (b.distance || Infinity);
      }
      
      return siqsComparison;
    });
    
    // Add filtered calculated locations
    sortedCalculatedLocations.forEach(location => {
      // Skip water locations for calculated spots
      if (location.latitude && location.longitude && 
          !location.isDarkSkyReserve && !location.certification &&
          isWaterLocation(location.latitude, location.longitude)) {
        return;
      }
      
      // Check if this location is too close to any existing location
      const tooClose = result.some(existingLocation => {
        // Never filter out by distance for certified locations
        if (location.isDarkSkyReserve || location.certification) return false;
        
        if (!location.latitude || !location.longitude || 
            !existingLocation.latitude || !existingLocation.longitude) return false;
        
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          existingLocation.latitude,
          existingLocation.longitude
        );
        
        return distance < minDistance;
      });
      
      // If not too close, add it to the result
      if (!tooClose) {
        result.push(location);
      }
    });
  }
  
  return result;
};

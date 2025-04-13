
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/utils/geoUtils";
import { isWaterLocation } from "@/utils/locationValidator";

/**
 * Efficiently filter locations by quality and distance
 * @param locations The locations to filter
 * @param userLocation The current user location
 * @param radius The search radius in kilometers
 * @param qualityThreshold Minimum SIQS score threshold
 * @returns Filtered array of locations
 */
export function filterLocationsByQualityAndDistance(
  locations: SharedAstroSpot[],
  userLocation: { latitude: number; longitude: number } | null,
  radius: number,
  qualityThreshold: number = 0
): SharedAstroSpot[] {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  // Create a set for O(1) lookups for duplicate checking
  const uniqueLocationKeys = new Set<string>();
  
  return locations.filter(location => {
    // Skip locations with no coordinates
    if (!location.latitude || !location.longitude) {
      return false;
    }
    
    // Deduplicate locations
    const locationKey = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
    if (uniqueLocationKeys.has(locationKey)) {
      return false;
    }
    uniqueLocationKeys.add(locationKey);
    
    // Always keep certified locations
    if (location.isDarkSkyReserve || location.certification) {
      return true;
    }
    
    // Filter out water locations for calculated spots
    if (isWaterLocation(location.latitude, location.longitude)) {
      return false;
    }
    
    // Filter by quality
    if (typeof location.siqs === 'number' && location.siqs < qualityThreshold) {
      return false;
    }
    
    // Filter by distance if user location is provided
    if (userLocation && radius > 0) {
      // Use existing distance property or calculate it
      const distance = location.distance || calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.latitude,
        location.longitude
      );
      
      // Add or update the distance property
      location.distance = distance;
      
      // Filter out locations beyond the radius
      return distance <= radius;
    }
    
    return true;
  });
}

/**
 * Sort locations by quality and distance
 * @param locations Locations to sort
 * @returns Sorted array of locations
 */
export function sortLocationsByQualityAndDistance(
  locations: SharedAstroSpot[]
): SharedAstroSpot[] {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  return [...locations].sort((a, b) => {
    // First prioritize certified locations
    if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) {
      return -1;
    }
    if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) {
      return 1;
    }
    
    // Then sort by SIQS score
    if ((a.siqs || 0) !== (b.siqs || 0)) {
      return (b.siqs || 0) - (a.siqs || 0);
    }
    
    // Then sort by distance
    return (a.distance || Infinity) - (b.distance || Infinity);
  });
}

/**
 * Filter calculated locations to ensure only one location per 50km radius
 * Prevents redundant API calls for nearby locations
 * @param locations Array of locations
 * @returns Filtered array with only one location per 50km radius
 */
export function filterCalculatedLocationsForMap(
  locations: SharedAstroSpot[]
): SharedAstroSpot[] {
  if (!locations || locations.length === 0) {
    return [];
  }
  
  const DEDUPLICATION_RADIUS_KM = 50; // 50km radius for deduplication
  const filteredLocations: SharedAstroSpot[] = [];
  const coveredAreas = new Map<string, boolean>();
  
  // First, sort by SIQS to prioritize better viewing conditions
  const sortedLocations = [...locations].sort((a, b) => 
    ((b.siqs || 0) - (a.siqs || 0))
  );
  
  // Always include certified locations
  const certifiedLocations = sortedLocations.filter(
    loc => loc.isDarkSkyReserve || loc.certification
  );
  
  // Add certified locations to our results
  filteredLocations.push(...certifiedLocations);
  
  // Mark areas covered by certified locations
  certifiedLocations.forEach(loc => {
    if (!loc.latitude || !loc.longitude) return;
    
    // Use a grid-based approach for faster lookups
    const gridKey = `${Math.floor(loc.latitude)}:${Math.floor(loc.longitude)}`;
    coveredAreas.set(gridKey, true);
  });
  
  // Now process calculated (non-certified) locations
  const calculatedLocations = sortedLocations.filter(
    loc => !(loc.isDarkSkyReserve || loc.certification)
  );
  
  calculatedLocations.forEach(location => {
    if (!location.latitude || !location.longitude) return;
    
    // Create grid key for this location
    const gridKey = `${Math.floor(location.latitude)}:${Math.floor(location.longitude)}`;
    
    // Skip if this grid cell is already covered
    if (coveredAreas.has(gridKey)) {
      return;
    }
    
    // Check if this location is within DEDUPLICATION_RADIUS_KM of any filtered location
    const tooClose = filteredLocations.some(existingLoc => {
      if (!existingLoc.latitude || !existingLoc.longitude) return false;
      
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        existingLoc.latitude,
        existingLoc.longitude
      );
      
      return distance <= DEDUPLICATION_RADIUS_KM;
    });
    
    // If not too close to existing locations, add it
    if (!tooClose) {
      filteredLocations.push(location);
      coveredAreas.set(gridKey, true);
    }
  });
  
  return filteredLocations;
}

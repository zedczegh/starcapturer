import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/utils/geoUtils";
import { isWaterLocation } from "@/utils/locationValidator";

/**
 * Efficiently filter locations by quality and distance with enhanced accuracy
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
  const terrain = new Map<string, {elevation: number, slope: number}>();
  
  // Enhanced filtering with terrain awareness and quality prioritization
  return locations.filter(location => {
    // Skip locations with no coordinates
    if (!location.latitude || !location.longitude) {
      return false;
    }
    
    // Improved precision for deduplication (5 decimal places ≈ 1.1m precision)
    const locationKey = `${location.latitude.toFixed(5)}-${location.longitude.toFixed(5)}`;
    if (uniqueLocationKeys.has(locationKey)) {
      return false;
    }
    uniqueLocationKeys.add(locationKey);
    
    // Always keep certified locations regardless of other criteria
    if (location.isDarkSkyReserve || location.certification) {
      return true;
    }
    
    // Filter out water locations for calculated spots with enhanced detection
    if (isWaterLocation(location.latitude, location.longitude)) {
      // Add exception for lakeside locations that might be good viewing spots
      // by checking the 'name' field for indicators
      const name = location.name?.toLowerCase() || '';
      const isLakesideLocation = name.includes('lake') || name.includes('shore') || 
                              name.includes('湖') || name.includes('海边') ||
                              name.includes('coast') || name.includes('bay');
                              
      // Keep lakeside locations as they often offer good viewing conditions
      // despite technically being classified as water
      if (!isLakesideLocation) {
        return false;
      }
    }
    
    // Enhanced quality filtering with variable threshold based on distance
    if (typeof location.siqs === 'number') {
      // Adjust threshold based on distance - be more lenient for nearby locations
      let adjustedThreshold = qualityThreshold;
      
      if (userLocation && radius > 0) {
        const distance = location.distance || calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          location.latitude,
          location.longitude
        );
        
        // Be more lenient for close locations (within 20% of radius)
        if (distance < radius * 0.2) {
          adjustedThreshold = Math.max(0, qualityThreshold - 1);
        }
        // Be more strict for distant locations (beyond 75% of radius)
        else if (distance > radius * 0.75) {
          adjustedThreshold = qualityThreshold + 0.5;
        }
      }
      
      // Special handling for high elevation locations - they often have better sky quality
      // even if not explicitly measured
      let terrainBonus = 0;
      const terrainKey = locationKey.split('-')[0] + '-' + locationKey.split('-')[1].substring(0, 2);
      if (terrain.has(terrainKey)) {
        const terrainData = terrain.get(terrainKey)!;
        if (terrainData.elevation > 1000) {
          terrainBonus = 1; // High elevation bonus
        } else if (terrainData.elevation > 500) {
          terrainBonus = 0.5; // Moderate elevation bonus
        }
      }
      
      // Apply the quality filter with terrain bonus
      if (location.siqs < adjustedThreshold - terrainBonus) {
        return false;
      }
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
      
      // Add or update the distance property for later use
      location.distance = distance;
      
      // Filter out locations beyond the radius
      return distance <= radius;
    }
    
    return true;
  });
}

/**
 * Sort locations by quality and distance with enhanced algorithms
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
    const aCertified = a.isDarkSkyReserve || !!a.certification;
    const bCertified = b.isDarkSkyReserve || !!b.certification;
    
    if (aCertified && !bCertified) {
      return -1;
    }
    if (!aCertified && bCertified) {
      return 1;
    }
    
    // If both are certified or both aren't certified, use more sophisticated sorting
    
    // For certified locations, sort by SIQS first, then by distance
    if (aCertified && bCertified) {
      // If SIQS differs, sort by that
      if ((a.siqs || 0) !== (b.siqs || 0)) {
        return (b.siqs || 0) - (a.siqs || 0);
      }
      
      // Otherwise sort by distance
      return (a.distance || Infinity) - (b.distance || Infinity);
    }
    
    // For non-certified locations, use a weighted combination of SIQS and distance
    // This creates a better balance between quality and proximity
    
    // Calculate weighted scores (70% SIQS, 30% proximity)
    const aScore = (a.siqs || 0) * 0.7 - ((a.distance || Infinity) / 100) * 0.3;
    const bScore = (b.siqs || 0) * 0.7 - ((b.distance || Infinity) / 100) * 0.3;
    
    return bScore - aScore;
  });
}

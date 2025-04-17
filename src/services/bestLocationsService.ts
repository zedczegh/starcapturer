/**
 * Service for finding the best astronomical locations
 */
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { isWaterLocation } from '@/utils/locationValidator';
import { isSiqsGreaterThan } from '@/utils/siqsHelpers';
import { isCertifiedLocation } from '@/utils/locationFiltering';

/**
 * Filter and find the best locations based on SIQS and other criteria
 * @param locations Array of locations to filter
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @param maxDistance Maximum distance in km
 * @param minSiqs Minimum SIQS score threshold
 * @returns Filtered and sorted locations
 */
export function findBestLocations(
  locations: SharedAstroSpot[],
  userLat: number,
  userLng: number,
  maxDistance: number = 200,
  minSiqs: number = 6
): SharedAstroSpot[] {
  if (!locations || !Array.isArray(locations) || locations.length === 0) {
    return [];
  }
  
  // Filter invalid locations
  const validLocations = locations.filter(loc => {
    // Basic location validation
    if (!loc || !loc.latitude || !loc.longitude) return false;
    
    // Skip water locations unless they're certified
    if (!isCertifiedLocation(loc) && isWaterLocation(loc.latitude, loc.longitude)) {
      return false;
    }
    
    // Keep all certified locations regardless of distance
    if (isCertifiedLocation(loc)) {
      return true;
    }
    
    // Calculate distance if not already set
    const distance = loc.distance || calculateDistance(
      userLat, 
      userLng, 
      loc.latitude, 
      loc.longitude
    );
    
    // Update distance property for future use
    loc.distance = distance;
    
    // Filter by distance for non-certified locations
    if (distance > maxDistance) {
      return false;
    }
    
    // Filter by SIQS for non-certified locations
    return loc.siqs && isSiqsGreaterThan(loc.siqs, minSiqs);
  });
  
  // Sort by certification status and distance
  return validLocations.sort((a, b) => {
    // Always prioritize certified locations
    const aIsCertified = isCertifiedLocation(a);
    const bIsCertified = isCertifiedLocation(b);
    
    if (aIsCertified && !bIsCertified) {
      return -1;
    }
    
    if (!aIsCertified && bIsCertified) {
      return 1;
    }
    
    // Within same category, sort by distance
    return (a.distance || Infinity) - (b.distance || Infinity);
  });
}

/**
 * Find nearby high-quality locations
 */
export function findNearbyHighQualityLocations(
  locations: SharedAstroSpot[],
  userLat: number,
  userLng: number,
  radius: number = 100,
  limit: number = 10
): SharedAstroSpot[] {
  const bestLocations = findBestLocations(
    locations,
    userLat,
    userLng,
    radius,
    7 // High quality threshold
  );
  
  return bestLocations.slice(0, limit);
}

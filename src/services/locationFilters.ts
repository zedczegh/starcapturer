
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { isWaterLocation, isValidAstronomyLocation } from '@/utils/locationValidator';
import { calculateDistance } from '@/lib/api/coordinates';
import { getSiqsScore } from '@/utils/siqsHelpers';

/**
 * Sort locations by quality and distance using enhanced algorithms
 * @param locations Array of locations
 * @returns Sorted array of locations
 */
export function sortLocationsByQuality(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    // First prioritize certified locations
    if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) {
      return -1;
    }
    if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) {
      return 1;
    }
    
    // If both are certified or both are not certified, check if they're in the same category
    const aIsCertified = a.isDarkSkyReserve || a.certification;
    const bIsCertified = b.isDarkSkyReserve || b.certification;
    
    // Use sophisticated scoring that considers multiple factors
    if (aIsCertified && bIsCertified) {
      return calculateLocationScore(b) - calculateLocationScore(a);
    }
    
    if (!aIsCertified && !bIsCertified) {
      return calculateLocationScore(b) - calculateLocationScore(a);
    }
    
    // Default case: sort by SIQS score
    return (getSiqsScore(b.siqs) || 0) - (getSiqsScore(a.siqs) || 0);
  });
}

/**
 * Calculate a comprehensive location score considering multiple factors
 * @param location The location to score
 * @returns A normalized score (higher is better)
 */
function calculateLocationScore(location: SharedAstroSpot): number {
  // Base score from SIQS
  const siqsScore = getSiqsScore(location.siqs) || 0;
  
  // Distance factor (closer is better, but with diminishing returns)
  const distanceFactor = location.distance 
    ? Math.max(0, 1 - Math.sqrt(location.distance) / 40)
    : 0;
  
  // Bortle scale factor (lower is better)
  const bortleFactor = location.bortleScale
    ? Math.max(0, (10 - location.bortleScale) / 9)
    : 0.5;
  
  // Certification bonus
  const certificationBonus = (location.isDarkSkyReserve || location.certification) ? 2 : 0;
  
  // Weight the factors (SIQS has the highest weight)
  return (siqsScore * 0.6) + (distanceFactor * 0.2) + (bortleFactor * 0.1) + certificationBonus;
}

/**
 * Filter locations by criteria with advanced filtering algorithms
 * @param locations Array of locations to filter
 * @returns Filtered array of locations
 */
export function filterLocations(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  if (!locations || !Array.isArray(locations)) {
    console.warn("Invalid locations array passed to filterLocations");
    return [];
  }
  
  return locations.filter(point => {
    // Always include certified locations
    if (point.isDarkSkyReserve || point.certification) {
      return true;
    }
    
    // Basic coordinate validation
    if (!point.latitude || !point.longitude || 
        !isFinite(point.latitude) || !isFinite(point.longitude)) {
      return false;
    }
    
    // Water check with relaxed validation for calculated spots
    if (isWaterLocation(point.latitude, point.longitude, false)) {
      return false;
    }
    
    // Apply astronomy validity check with relaxed parameters
    return isValidAstronomyLocation(point.latitude, point.longitude, point.name);
  });
}

/**
 * Generate a random point within a specified radius using enhanced algorithms
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radius Radius in kilometers
 * @returns Random point object with additional metadata
 */
export function generateRandomPoint(
  centerLat: number, 
  centerLng: number, 
  radius: number
): { latitude: number, longitude: number, distance: number } {
  // Use improved point generation for more natural distribution
  
  // Instead of uniform distribution, use squared root for more points near center
  // This creates a more natural density gradient
  const r = radius * Math.sqrt(Math.random()); // Squared root distribution
  const theta = Math.random() * 2 * Math.PI; // Random angle
  
  // Convert to cartesian coordinates
  const x = r * Math.cos(theta);
  const y = r * Math.sin(theta);
  
  // Convert to lat/lng, accounting for Earth's curvature
  // 111.32 km per degree of latitude is approximate at the equator
  // Need to adjust longitude based on latitude (Earth narrows at higher latitudes)
  const latRadians = centerLat * (Math.PI / 180);
  const kmPerDegreeLat = 111.32; // km per degree latitude (approximate)
  const kmPerDegreeLng = 111.32 * Math.cos(latRadians); // Adjust for latitude
  
  const newLat = centerLat + (y / kmPerDegreeLat);
  const newLng = centerLng + (x / kmPerDegreeLng);
  
  // Calculate actual distance using Haversine formula
  const distance = calculateDistance(centerLat, centerLng, newLat, newLng);
  
  return {
    latitude: newLat,
    longitude: newLng,
    distance
  };
}

/**
 * Generate multiple points with improved distribution to cover the area more evenly
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radius Radius in kilometers
 * @param count Number of points to generate
 */
export function generateDistributedPoints(
  centerLat: number,
  centerLng: number,
  radius: number,
  count: number = 20
): { latitude: number, longitude: number, distance: number }[] {
  const points: { latitude: number, longitude: number, distance: number }[] = [];
  
  // Generate initial random points
  for (let i = 0; i < count * 2; i++) {
    points.push(generateRandomPoint(centerLat, centerLng, radius));
  }
  
  // Apply spatial distribution algorithm to select well-distributed subset
  // This uses a simple greedy approach to maximize minimum distance between points
  const selectedPoints: { latitude: number, longitude: number, distance: number }[] = [];
  
  // Add first point
  if (points.length > 0) {
    selectedPoints.push(points[0]);
  }
  
  // Add remaining points by maximizing minimum distance to existing points
  while (selectedPoints.length < count && points.length > selectedPoints.length) {
    let bestPoint = null;
    let bestMinDist = -1;
    
    for (const candidate of points) {
      if (selectedPoints.some(p => p === candidate)) continue;
      
      // Find minimum distance to any existing selected point
      let minDist = Infinity;
      for (const selected of selectedPoints) {
        const dist = calculateDistance(
          candidate.latitude, candidate.longitude,
          selected.latitude, selected.longitude
        );
        minDist = Math.min(minDist, dist);
      }
      
      // If this candidate has a larger minimum distance, it's better
      if (minDist > bestMinDist) {
        bestMinDist = minDist;
        bestPoint = candidate;
      }
    }
    
    // Add best candidate to selected points
    if (bestPoint) {
      selectedPoints.push(bestPoint);
    } else {
      break; // No more candidates
    }
  }
  
  return selectedPoints;
}

// Remove the duplicate export at the end of the file
// export { sortLocationsByQuality };

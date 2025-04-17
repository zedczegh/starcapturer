
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { calculateDistance } from '@/utils/geoUtils';
import { batchCalculateSiqs } from '@/services/realTimeSiqs/realTimeSiqsService';
import { getRecommendedPhotoPoints } from '@/lib/api/astroSpots';
import { isValidCoordinates, isSuitableLocation } from '@/utils/locationValidator';

/**
 * Find locations within a specific radius
 */
export async function findLocationsWithinRadius(
  latitude: number,
  longitude: number,
  radius: number = 100
): Promise<SharedAstroSpot[]> {
  try {
    // Validate coordinates
    if (!isValidCoordinates(latitude, longitude)) {
      console.error('Invalid coordinates provided:', latitude, longitude);
      return [];
    }
    
    // Get recommended photo points from API
    const locations = await getRecommendedPhotoPoints(latitude, longitude, radius);
    
    // Calculate distance and filter by radius
    const locationsWithDistance = locations.map(location => {
      const distance = calculateDistance(
        latitude, 
        longitude, 
        location.latitude, 
        location.longitude
      );
      
      return {
        ...location,
        distance
      };
    }).filter(location => location.distance <= radius);
    
    console.log(`Found ${locationsWithDistance.length} locations within ${radius}km radius`);
    
    // Calculate real-time SIQS
    const locationsWithSiqs = await batchCalculateSiqs(locationsWithDistance);
    
    return locationsWithSiqs;
  } catch (error) {
    console.error('Error finding locations within radius:', error);
    return [];
  }
}

/**
 * Sort locations by quality and distance
 */
export function sortLocationsByQuality(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    // Prioritize dark sky reserves and certified locations
    const aIsCertified = Boolean(a.isDarkSkyReserve || a.certification);
    const bIsCertified = Boolean(b.isDarkSkyReserve || b.certification);
    
    // If one is certified and the other isn't, the certified one comes first
    if (aIsCertified && !bIsCertified) return -1;
    if (!aIsCertified && bIsCertified) return 1;
    
    // If both are certified or both are not, sort by SIQS
    const aScore = getSiqsScore(a.siqs);
    const bScore = getSiqsScore(b.siqs);
    
    // Sort by SIQS in descending order (higher scores first)
    const siqsComparison = bScore - aScore;
    
    // If SIQS scores are similar, sort by distance
    if (Math.abs(siqsComparison) < 0.5) {
      return (a.distance || Infinity) - (b.distance || Infinity);
    }
    
    return siqsComparison;
  });
}

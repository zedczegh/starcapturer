
import { SharedAstroSpot } from '@/lib/siqs/types';
import { calculateDistance } from '@/lib/api/coordinates';
import { getDarkSkyAstroSpots } from './darkSkyLocationService';
import { isWaterLocation } from '@/utils/locationValidator';

/**
 * Find locations within a specified radius
 * @param latitude Center latitude
 * @param longitude Center longitude 
 * @param radius Search radius in km
 * @param certifiedOnly Whether to return only certified locations
 * @returns Promise resolving to locations within radius
 */
export async function findLocationsWithinRadius(
  latitude: number,
  longitude: number,
  radius: number,
  certifiedOnly: boolean = false
): Promise<SharedAstroSpot[]> {
  try {
    console.log(`Finding locations within ${radius}km of ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    
    // Get dark sky locations
    const darkSkyLocations = getDarkSkyAstroSpots(latitude, longitude, radius);
    
    // Filter by certification status if requested
    if (certifiedOnly) {
      return darkSkyLocations.filter(loc => 
        loc.isDarkSkyReserve || (loc.certification && loc.certification.length > 0)
      );
    }
    
    return darkSkyLocations;
  } catch (error) {
    console.error("Error finding locations within radius:", error);
    return [];
  }
}

/**
 * Find calculated potential locations within radius
 * @param latitude User latitude
 * @param longitude User longitude
 * @param radius Search radius in km
 * @returns Promise resolving to potential locations
 */
export async function findCalculatedLocations(
  latitude: number,
  longitude: number,
  radius: number
): Promise<SharedAstroSpot[]> {
  try {
    console.log(`Generating calculated locations within ${radius}km of ${latitude}, ${longitude}`);
    
    const calculatedLocations: SharedAstroSpot[] = [];
    const pointsToGenerate = Math.min(20, Math.ceil(radius / 10)); // Scale number of points with radius
    
    // Generate points evenly distributed around the center
    for (let i = 0; i < pointsToGenerate; i++) {
      // Calculate angle for even distribution
      const angle = (i / pointsToGenerate) * Math.PI * 2;
      
      // Random distance within 30-90% of radius for variety
      const distance = radius * (0.3 + Math.random() * 0.6);
      
      // Convert polar to cartesian
      const offsetKm = {
        lat: Math.sin(angle) * distance,
        lng: Math.cos(angle) * distance
      };
      
      // Convert km to degrees (approximate)
      const latDegPerKm = 1 / 110.574;
      const lngDegPerKm = 1 / (111.32 * Math.cos(latitude * Math.PI / 180));
      
      const pointLat = latitude + (offsetKm.lat * latDegPerKm);
      const pointLng = longitude + (offsetKm.lng * lngDegPerKm);
      
      // Skip if it's a water location
      if (isWaterLocation(pointLat, pointLng)) {
        continue;
      }
      
      // Create location
      const calculatedLocation: SharedAstroSpot = {
        id: `calc-${i}-${Date.now()}`,
        name: `Potential dark site ${i + 1}`,
        latitude: pointLat,
        longitude: pointLng,
        bortleScale: 3 + Math.floor(Math.random() * 3), // Random Bortle scale 3-5
        distance: distance,
        timestamp: new Date().toISOString()
      };
      
      calculatedLocations.push(calculatedLocation);
    }
    
    return calculatedLocations;
  } catch (error) {
    console.error("Error generating calculated locations:", error);
    return [];
  }
}

/**
 * Sort locations by quality and distance
 * @param locations Array of locations to sort
 * @returns Sorted locations array
 */
export function sortLocationsByQuality(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  return [...locations].sort((a, b) => {
    // First sort by certification status
    const aIsCertified = Boolean(a.isDarkSkyReserve || a.certification);
    const bIsCertified = Boolean(b.isDarkSkyReserve || b.certification);
    
    if (aIsCertified && !bIsCertified) return -1;
    if (!aIsCertified && bIsCertified) return 1;
    
    // Then sort by SIQS if available
    const aSiqs = a.siqsResult?.score ?? a.siqs ?? 0;
    const bSiqs = b.siqsResult?.score ?? b.siqs ?? 0;
    
    if (aSiqs !== bSiqs) {
      return bSiqs - aSiqs; // Higher SIQS first
    }
    
    // Finally sort by distance
    return (a.distance || Infinity) - (b.distance || Infinity);
  });
}

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
    
    // FURTHER REDUCED DENSITY: Scale number of points with radius but with even lower density
    // Using min(8, radius/25) to generate fewer points
    const pointsToGenerate = Math.min(8, Math.ceil(radius / 25));
    
    console.log(`Generating ${pointsToGenerate} calculated locations to reduce API load`);
    
    // Generate points evenly distributed around the center
    for (let i = 0; i < pointsToGenerate; i++) {
      // Calculate angle for even distribution
      const angle = (i / pointsToGenerate) * Math.PI * 2;
      
      // Random distance within 40-90% of radius for better spread
      // Use a different random seed for each point to ensure variety
      const randomSeed = Math.sin(angle * 1000 + i) * 0.5 + 0.5; // Deterministic yet varied
      const distance = radius * (0.4 + randomSeed * 0.5);
      
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
      
      // Skip if it's a water location - do this check early to avoid wasted calculation
      if (isWaterLocation(pointLat, pointLng)) {
        continue;
      }
      
      // Add a small random offset to each point to prevent point clustering
      // Use a different random seed for variation but keep it deterministic
      const jitterFactor = 0.05; // 5% jitter maximum
      const latJitter = ((Math.sin(angle * 73.4 + i * 2.3) * 0.5 + 0.5) * jitterFactor - jitterFactor/2) * radius * latDegPerKm;
      const lngJitter = ((Math.cos(angle * 47.9 + i * 1.7) * 0.5 + 0.5) * jitterFactor - jitterFactor/2) * radius * lngDegPerKm;
      
      const finalLat = pointLat + latJitter;
      const finalLng = pointLng + lngJitter;
      
      // Create location with a more specific ID to avoid duplicates
      const calculatedLocation: SharedAstroSpot = {
        id: `calc-${latitude.toFixed(3)}-${longitude.toFixed(3)}-${i}-${Date.now()}`,
        name: `Potential dark site ${i + 1}`,
        latitude: finalLat,
        longitude: finalLng,
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

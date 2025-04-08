
import { SharedAstroSpot } from '@/lib/siqs/types';
import { isWaterLocation } from '@/utils/locationValidator';
import { calculateDistance } from '@/utils/geoUtils';

/**
 * Find locations within a specified radius from a center point
 */
export const findLocationsWithinRadius = async (
  latitude: number,
  longitude: number,
  radius: number
): Promise<SharedAstroSpot[]> => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Return mock data for now
    const mockLocations: SharedAstroSpot[] = [
      {
        id: `cert-${Date.now()}-1`,
        name: "Dark Sky Reserve",
        latitude: latitude + 0.05,
        longitude: longitude + 0.05,
        bortleScale: 3,
        siqs: 8.2,
        isDarkSkyReserve: true,
        certification: "International Dark Sky Reserve",
        timestamp: new Date().toISOString()
      },
      {
        id: `calc-${Date.now()}-1`,
        name: "Mountain Viewpoint",
        latitude: latitude - 0.1,
        longitude: longitude - 0.1,
        bortleScale: 4,
        siqs: 7.4,
        timestamp: new Date().toISOString()
      }
    ];
    
    // Calculate distance for each location
    const locationsWithDistance = mockLocations.map(loc => ({
      ...loc,
      distance: calculateDistance(latitude, longitude, loc.latitude, loc.longitude)
    }));
    
    // Filter by radius
    return locationsWithDistance.filter(loc => (loc.distance || 0) <= radius);
  } catch (error) {
    console.error("Error finding locations within radius:", error);
    return [];
  }
};

/**
 * Find calculated locations within a specified radius
 */
export const findCalculatedLocations = async (
  latitude: number,
  longitude: number,
  radius: number,
  allowExpansion: boolean = true,
  limit: number = 10
): Promise<SharedAstroSpot[]> => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate mock calculated locations
    const locations: SharedAstroSpot[] = [];
    
    // Number of locations to generate
    const count = Math.min(limit, 20);
    
    for (let i = 0; i < count; i++) {
      // Generate random coordinates within radius
      const randomRadius = Math.random() * radius;
      const randomAngle = Math.random() * Math.PI * 2;
      
      const lat = latitude + (randomRadius / 111.32) * Math.cos(randomAngle);
      const lng = longitude + (randomRadius / (111.32 * Math.cos(latitude * Math.PI / 180))) * Math.sin(randomAngle);
      
      // Skip if it's a water location
      if (isWaterLocation(lat, lng)) {
        continue;
      }
      
      // Calculate actual distance
      const distance = calculateDistance(latitude, longitude, lat, lng);
      
      // Calculate a random bortle scale (weighted toward better locations)
      const bortleScale = Math.min(9, Math.max(1, Math.floor(Math.random() * 6) + 2));
      
      // Calculate a SIQS score based on bortle scale
      const siqs = Math.min(10, Math.max(1, 11 - bortleScale + (Math.random() * 2 - 1)));
      
      locations.push({
        id: `calc-${Date.now()}-${i}`,
        name: `Calculated Location ${i+1}`,
        latitude: lat,
        longitude: lng,
        bortleScale: bortleScale,
        siqs: siqs,
        distance: distance,
        timestamp: new Date().toISOString()
      });
    }
    
    return locations.filter(loc => (loc.distance || 0) <= radius);
  } catch (error) {
    console.error("Error finding calculated locations:", error);
    return [];
  }
};

/**
 * Sort locations by quality and distance
 */
export const sortLocationsByQuality = (
  locations: SharedAstroSpot[]
): SharedAstroSpot[] => {
  return [...locations].sort((a, b) => {
    // First prioritize certified locations
    if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) {
      return -1;
    }
    if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) {
      return 1;
    }
    
    // Then prioritize by SIQS
    const aSiqs = a.siqs || 0;
    const bSiqs = b.siqs || 0;
    
    if (Math.abs(aSiqs - bSiqs) > 1) {
      return bSiqs - aSiqs; // Higher SIQS first
    }
    
    // If SIQS is similar, prioritize by distance
    return (a.distance || Infinity) - (b.distance || Infinity);
  });
};

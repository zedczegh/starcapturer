
/**
 * Utilities for checking if a location is on water
 */

import { calculateDistance } from "./geoUtils";

// Cache water check results
const waterCheckCache = new Map<string, boolean>();

/**
 * Check if the location is likely on water (ocean, lake, etc.)
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param useCache Whether to use cached results (default: true)
 * @returns Boolean indicating if location is on water
 */
export function isWaterLocation(latitude: number, longitude: number, useCache = true): boolean {
  if (!latitude || !longitude) return false;
  
  // Generate cache key
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Check cache first if enabled
  if (useCache && waterCheckCache.has(cacheKey)) {
    return waterCheckCache.get(cacheKey) as boolean;
  }
  
  // Simple check based on known bodies of water
  // This is a simplified method; in a real app we would use GeoJSON or API
  
  // Define some known water bodies
  const waterBodies = [
    // Pacific Ocean (rough center points)
    { lat: 0, lng: -160, radius: 5000 },
    { lat: 30, lng: -140, radius: 3000 },
    { lat: -30, lng: -140, radius: 3000 },
    { lat: 30, lng: 160, radius: 3000 },
    { lat: -30, lng: 160, radius: 3000 },
    
    // Atlantic Ocean
    { lat: 30, lng: -40, radius: 2500 },
    { lat: 0, lng: -30, radius: 2500 },
    { lat: -30, lng: -20, radius: 2500 },
    
    // Indian Ocean
    { lat: 0, lng: 80, radius: 2500 },
    { lat: -20, lng: 80, radius: 2500 },
    
    // Major lakes and seas
    { lat: 45, lng: 35, radius: 400 }, // Black Sea
    { lat: 40, lng: 50, radius: 350 }, // Caspian Sea
    { lat: 45, lng: -87, radius: 200 }, // Lake Michigan
    { lat: 45, lng: -83, radius: 200 }, // Lake Huron
    { lat: 43, lng: -79, radius: 100 }, // Lake Ontario
    { lat: 42, lng: -81, radius: 100 }, // Lake Erie
    { lat: 47, lng: -90, radius: 180 }, // Lake Superior
  ];
  
  // Check if location is near any known water body
  const isOnWater = waterBodies.some(body => {
    const distance = calculateDistance(latitude, longitude, body.lat, body.lng);
    return distance <= body.radius;
  });
  
  // Cache result for future use
  if (useCache) {
    waterCheckCache.set(cacheKey, isOnWater);
    
    // Limit cache size
    if (waterCheckCache.size > 10000) {
      // Remove oldest entries when cache gets too large
      const keysToDelete = Array.from(waterCheckCache.keys()).slice(0, 1000);
      keysToDelete.forEach(key => waterCheckCache.delete(key));
    }
  }
  
  return isOnWater;
}

/**
 * Clear the water check cache
 */
export function clearWaterCheckCache(): void {
  waterCheckCache.clear();
}

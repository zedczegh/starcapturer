import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { isWaterLocation } from '@/utils/validation';
import { getRandomFloat, getRandomInt } from '@/utils/random';
import { getBortleScaleForLocation } from '@/utils/bortleScaleUtils';
import { generateLocationName } from '@/utils/locationNameGenerator';

// Options for location search
export interface LocationSearchOptions {
  minSiqs?: number;
  maxResults?: number;
  includeWater?: boolean;
  preferHigherAltitude?: boolean;
  onlyDarkSkyReserves?: boolean;
}

/**
 * Find locations within a specified radius of a center point
 * @param centerLat Center latitude
 * @param centerLon Center longitude
 * @param radiusKm Radius in kilometers
 * @param options Search options
 * @returns Array of locations
 */
export function findLocationsInArea(
  centerLat: number,
  centerLon: number,
  radiusKm: number,
  options?: LocationSearchOptions
): SharedAstroSpot[] {
  const defaultOptions: LocationSearchOptions = {
    minSiqs: 0,
    maxResults: 50,
    includeWater: false,
    preferHigherAltitude: true,
    onlyDarkSkyReserves: false
  };

  const mergedOptions = { ...defaultOptions, ...options };
  
  // Generate a set of random locations within the radius
  const numLocations = getRandomInt(10, 30);
  let validLocations: SharedAstroSpot[] = [];
  
  for (let i = 0; i < numLocations * 3; i++) {
    // Generate a random distance within the radius
    const distance = Math.sqrt(Math.random()) * radiusKm;
    
    // Generate a random angle
    const angle = Math.random() * 2 * Math.PI;
    
    // Calculate the offset in kilometers
    const latOffset = distance * Math.cos(angle) / 111.32; // 1 degree lat = 111.32 km
    const lonOffset = distance * Math.sin(angle) / (111.32 * Math.cos(centerLat * Math.PI / 180));
    
    // Calculate the new coordinates
    const lat = centerLat + latOffset;
    const lon = centerLon + lonOffset;
    
    // Skip if outside valid range
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      continue;
    }
    
    // Calculate actual distance (Haversine formula)
    const actualDistance = calculateDistance(centerLat, centerLon, lat, lon);
    
    // Skip if outside the radius
    if (actualDistance > radiusKm) {
      continue;
    }
    
    // Generate a random SIQS score based on Bortle scale
    const bortleScale = getBortleScaleForLocation(lat, lon);
    let siqs = 10 - bortleScale + getRandomFloat(-1, 1);
    siqs = Math.max(0, Math.min(10, siqs));
    
    // Generate a random altitude
    const altitude = getRandomInt(0, 2000);
    
    // Create the location
    validLocations.push({
      latitude: lat,
      longitude: lon,
      siqs: siqs,
      bortleScale: bortleScale,
      altitude: altitude,
      distance: actualDistance,
      name: generateLocationName(lat, lon),
      isDarkSkyReserve: Math.random() < 0.05 // 5% chance of being a dark sky reserve
    });
  }
  
  // Keep only locations on land, not in water (we don't want ocean points)
  validLocations = validLocations.filter(location => {
    return !isWaterLocation(location.latitude, location.longitude);
  });
  
  // Apply filters based on options
  if (mergedOptions.minSiqs && mergedOptions.minSiqs > 0) {
    validLocations = validLocations.filter(location => 
      (typeof location.siqs === 'number' && location.siqs >= mergedOptions.minSiqs!)
    );
  }
  
  if (mergedOptions.onlyDarkSkyReserves) {
    validLocations = validLocations.filter(location => location.isDarkSkyReserve);
  }
  
  // Sort by distance
  validLocations.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  
  // Limit the number of results
  if (mergedOptions.maxResults) {
    validLocations = validLocations.slice(0, mergedOptions.maxResults);
  }
  
  return validLocations;
}

/**
 * Find locations with good forecast for astrophotography
 * @param centerLat Center latitude
 * @param centerLon Center longitude
 * @param options Search options including forecast day
 * @returns Array of forecast locations
 */
export function findForecastLocations(
  center: { latitude: number; longitude: number },
  options: { day: number; radius: number; maxPoints: number }
): Promise<SharedAstroSpot[]> {
  return new Promise((resolve) => {
    // For now, this is a mock implementation
    // In a real app, this would call a weather API
    
    setTimeout(() => {
      const locations = findLocationsInArea(
        center.latitude,
        center.longitude,
        options.radius,
        { maxResults: options.maxPoints }
      );
      
      // Add forecast-specific properties
      const forecastLocations = locations.map(loc => ({
        ...loc,
        isForecast: true,
        forecastDay: options.day,
        forecastDate: new Date(Date.now() + options.day * 24 * 60 * 60 * 1000).toISOString(),
        // Simulate weather conditions - further days have more uncertainty
        cloudCover: Math.max(0, Math.min(100, getRandomInt(0, 40) + options.day * 2)),
        weatherScore: Math.max(0, Math.min(10, 10 - (getRandomInt(0, 3) + options.day * 0.5)))
      }));
      
      // Sort by weather score (higher is better)
      forecastLocations.sort((a, b) => 
        (b.weatherScore || 0) - (a.weatherScore || 0)
      );
      
      resolve(forecastLocations);
    }, 1000);
  });
}

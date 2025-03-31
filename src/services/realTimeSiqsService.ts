
import { fetchForecastData } from "@/lib/api";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { fetchWeatherData } from "@/lib/api/weather";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";

// Create a cache to avoid redundant API calls
const siqsCache = new Map<string, {
  siqs: number;
  timestamp: number;
  isViable: boolean;
}>();

// Invalidate cache entries older than 15 minutes
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Calculate real-time SIQS for a given location
 * @param latitude Latitude of the location
 * @param longitude Longitude of the location
 * @param bortleScale Bortle scale of the location (light pollution)
 * @returns Promise resolving to SIQS score and viability
 */
export async function calculateRealTimeSiqs(
  latitude: number, 
  longitude: number, 
  bortleScale: number
): Promise<{ siqs: number; isViable: boolean }> {
  // Generate cache key
  const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Check cache first
  const cachedData = siqsCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
    console.log(`Using cached SIQS data for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}, score: ${cachedData.siqs.toFixed(1)}`);
    return {
      siqs: cachedData.siqs,
      isViable: cachedData.isViable
    };
  }
  
  console.log(`Calculating real-time SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  
  try {
    // Fetch weather data
    const weatherData = await fetchWeatherData({
      latitude,
      longitude
    });
    
    // Fetch forecast data for nighttime calculation
    const forecastData = await fetchForecastData({
      latitude,
      longitude,
      days: 2
    });
    
    // Default values if API calls fail
    if (!weatherData) {
      return { siqs: 0, isViable: false };
    }
    
    // For light pollution, use provided Bortle scale or fetch it
    let finalBortleScale = bortleScale;
    if (!finalBortleScale || finalBortleScale <= 0) {
      try {
        const pollutionData = await fetchLightPollutionData(latitude, longitude);
        finalBortleScale = pollutionData?.bortleScale || 5;
      } catch (err) {
        console.error("Error fetching light pollution data:", err);
        finalBortleScale = 5; // Default fallback
      }
    }
    
    // Calculate SIQS using optimized method
    const siqsResult = await calculateSIQSWithWeatherData(
      weatherData,
      finalBortleScale,
      3, // Default seeing conditions
      0.5, // Default moon phase
      forecastData
    );
    
    console.log(`Calculated SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}: ${siqsResult.score.toFixed(1)}`);
    
    // Store in cache
    siqsCache.set(cacheKey, {
      siqs: siqsResult.score,
      isViable: siqsResult.isViable,
      timestamp: Date.now()
    });
    
    return {
      siqs: siqsResult.score,
      isViable: siqsResult.isViable
    };
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return { siqs: 0, isViable: false };
  }
}

/**
 * Batch process multiple locations for SIQS calculation
 * with smart prioritization and parallelization
 * @param locations Array of locations to process
 * @param maxParallel Maximum number of parallel requests
 * @returns Promise resolving to locations with updated SIQS
 */
export async function batchCalculateSiqs(
  locations: SharedAstroSpot[],
  maxParallel: number = 3
): Promise<SharedAstroSpot[]> {
  if (!locations || locations.length === 0) return [];
  
  console.log(`Batch calculating SIQS for ${locations.length} locations`);
  
  // Clone the locations array to avoid mutating the original
  const updatedLocations = [...locations];
  
  // Process locations in chunks to avoid too many parallel requests
  for (let i = 0; i < updatedLocations.length; i += maxParallel) {
    const chunk = updatedLocations.slice(i, i + maxParallel);
    const promises = chunk.map(async (location) => {
      if (!location.latitude || !location.longitude) return location;
      
      const result = await calculateRealTimeSiqs(
        location.latitude,
        location.longitude,
        location.bortleScale || 5
      );
      
      // Update the location object with real-time SIQS
      return {
        ...location,
        siqs: result.siqs,
        isViable: result.isViable
      };
    });
    
    // Wait for the current chunk to complete before processing next chunk
    const results = await Promise.all(promises);
    
    // Update the locations array with the results
    results.forEach((result, idx) => {
      updatedLocations[i + idx] = result;
    });
  }
  
  return updatedLocations;
}

/**
 * Find the best viewing locations based on SIQS score
 * Intelligently selects locations with best viewing conditions
 * @param userLat User's latitude
 * @param userLng User's longitude
 * @param radius Search radius in km
 * @param limit Maximum number of locations to return
 * @param certifiedOnly Whether to return only certified locations
 * @returns Promise resolving to array of locations with SIQS
 */
export async function findBestViewingLocations(
  userLat: number,
  userLng: number,
  radius: number,
  limit: number = 9,
  certifiedOnly: boolean = false
): Promise<SharedAstroSpot[]> {
  try {
    // Import the necessary functions
    const { getRecommendedPhotoPoints } = await import('@/lib/api');
    
    console.log(`Finding best viewing locations within ${radius}km radius, certified only: ${certifiedOnly}`);
    
    // Get recommended points within the specified radius
    const points = await getRecommendedPhotoPoints(userLat, userLng, radius, certifiedOnly);
    
    if (!points || points.length === 0) {
      console.log("No photo points found within radius");
      return [];
    }
    
    console.log(`Found ${points.length} potential photo points within ${radius}km radius`);
    
    // Calculate distances for each point if not already present
    const pointsWithDistance = points.map(point => {
      if (typeof point.distance !== 'number') {
        const distance = calculateDistance(userLat, userLng, point.latitude, point.longitude);
        return { ...point, distance };
      }
      return point;
    });
    
    // Sort by distance to find the closest locations
    const sortedByDistance = [...pointsWithDistance].sort((a, b) => 
      (a.distance || 0) - (b.distance || 0)
    );
    
    // Take up to 20 closest locations for SIQS calculation
    const candidateLimit = Math.min(20, sortedByDistance.length);
    const candidateLocations = sortedByDistance.slice(0, candidateLimit);
    
    console.log(`Selected ${candidateLocations.length} candidate locations for SIQS calculation`);
    
    // Calculate SIQS for these locations
    const locationsWithSiqs = await batchCalculateSiqs(candidateLocations);
    
    // Filter for locations with decent viewing conditions 
    const viableLocations = locationsWithSiqs
      .filter(loc => loc.siqs > 3.0) // Lower threshold to show more options
      .sort((a, b) => (b.siqs || 0) - (a.siqs || 0));
    
    if (viableLocations.length === 0) {
      console.log("No viable viewing locations found, returning best available");
      // If no viable locations, return best available sorted by SIQS
      return locationsWithSiqs
        .sort((a, b) => (b.siqs || 0) - (a.siqs || 0))
        .slice(0, limit);
    }
    
    console.log(`Found ${viableLocations.length} viable viewing locations`);
    
    // Return the top locations based on SIQS
    return viableLocations.slice(0, limit);
  } catch (error) {
    console.error("Error finding best viewing locations:", error);
    return [];
  }
}

/**
 * Get a list of locations with good SIQS scores within maximum range
 * This is used as a fallback when no good locations are found nearby
 */
export async function getFallbackLocations(
  userLat: number,
  userLng: number,
  maxRange: number = 10000
): Promise<SharedAstroSpot[]> {
  try {
    // Try to find at least some locations with decent conditions
    const { getRecommendedPhotoPoints } = await import('@/lib/api');
    
    console.log(`Finding fallback locations within ${maxRange}km radius`);
    
    // Get more locations within the max range
    const points = await getRecommendedPhotoPoints(userLat, userLng, maxRange, false, 30);
    
    if (!points || points.length === 0) {
      return [];
    }
    
    // Process a sample of the furthest locations to find good spots
    const sortedByDistance = [...points]
      .sort((a, b) => (b.distance || 0) - (a.distance || 0))
      .slice(0, 15); // Take 15 furthest locations
    
    // Calculate SIQS for these locations
    const locationsWithSiqs = await batchCalculateSiqs(sortedByDistance);
    
    // Return best SIQS scores regardless of threshold
    return locationsWithSiqs
      .sort((a, b) => (b.siqs || 0) - (a.siqs || 0))
      .slice(0, 9);
  } catch (error) {
    console.error("Error finding fallback locations:", error);
    return [];
  }
}

/**
 * Clear the SIQS cache for testing or debugging
 */
export function clearSiqsCache(): void {
  const size = siqsCache.size;
  siqsCache.clear();
  console.log(`SIQS cache cleared (${size} entries removed)`);
}

/**
 * Get the current SIQS cache size
 * @returns Number of cached entries
 */
export function getSiqsCacheSize(): number {
  return siqsCache.size;
}

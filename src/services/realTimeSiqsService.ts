
import { fetchForecastData } from "@/lib/api";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { fetchWeatherData } from "@/lib/api/weather";
import { formatSIQSScoreForDisplay } from "@/hooks/siqs/siqsCalculationUtils";
import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Create a cache to avoid redundant API calls
const siqsCache = new Map<string, {
  siqs: number;
  timestamp: number;
  isViable: boolean;
}>();

// Invalidate cache entries older than 30 minutes
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

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
    return {
      siqs: cachedData.siqs,
      isViable: cachedData.isViable
    };
  }
  
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
    
    // Calculate SIQS using optimized method
    const siqsResult = await calculateSIQSWithWeatherData(
      weatherData,
      bortleScale,
      3, // Default seeing conditions
      0.5, // Default moon phase
      forecastData
    );
    
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
 * @returns Promise resolving to array of locations with SIQS
 */
export async function findBestViewingLocations(
  userLat: number,
  userLng: number,
  radius: number,
  limit: number = 9
): Promise<SharedAstroSpot[]> {
  try {
    // Import the necessary functions
    const { getRecommendedPhotoPoints } = await import('@/lib/api');
    const { calculateDistance } = await import('@/data/utils/distanceCalculator');
    
    // Get recommended points within the specified radius
    const points = await getRecommendedPhotoPoints(userLat, userLng, radius);
    
    if (!points || points.length === 0) {
      console.log("No photo points found within radius");
      return [];
    }
    
    console.log(`Found ${points.length} potential photo points within ${radius}km radius`);
    
    // Calculate real-time SIQS for up to 15 locations (to have options)
    // Prioritize closer locations first
    const sortedByDistance = [...points].sort((a, b) => {
      const distA = typeof a.distance === 'number' ? a.distance : 
        calculateDistance(userLat, userLng, a.latitude, a.longitude);
      const distB = typeof b.distance === 'number' ? b.distance : 
        calculateDistance(userLat, userLng, b.latitude, b.longitude);
      return distA - distB;
    });
    
    // Take the 15 closest locations for SIQS calculation
    const candidateLocations = sortedByDistance.slice(0, 15);
    
    // Calculate SIQS for these locations
    const locationsWithSiqs = await batchCalculateSiqs(candidateLocations);
    
    // Filter for locations with viable viewing conditions and sort by SIQS
    const viableLocations = locationsWithSiqs
      .filter(loc => loc.siqs > 4.0) // Good viewing threshold
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
 * Clear the SIQS cache for testing or debugging
 */
export function clearSiqsCache(): void {
  siqsCache.clear();
  console.log("SIQS cache cleared");
}

/**
 * Get the current SIQS cache size
 * @returns Number of cached entries
 */
export function getSiqsCacheSize(): number {
  return siqsCache.size;
}

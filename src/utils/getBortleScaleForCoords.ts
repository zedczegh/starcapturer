
import { getBortleScaleData } from "@/services/environmentalDataService/bortleScaleService";

// Enhanced in-memory cache for session data with TTL (time-to-live)
const cache = new Map<string, { value: number; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get Bortle scale for given lat/lng, with in-memory caching. Returns null if failed.
 * Enhanced with better error handling and force refresh capability
 */
export async function getBortleScaleForCoords(
  latitude: number, 
  longitude: number, 
  originalName: string,
  forceRefresh = false
): Promise<number | null> {
  // Validate inputs to prevent invalid requests
  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    console.error("Invalid coordinates provided to getBortleScaleForCoords");
    return null;
  }

  // Generate cache key from rounded coordinates (5 decimal places is ~1m precision)
  const cacheKey = `${latitude.toFixed(5)}-${longitude.toFixed(5)}`;
  
  // Check cache first, unless force refresh is requested
  if (!forceRefresh) {
    const cachedValue = cache.get(cacheKey);
    if (cachedValue && Date.now() - cachedValue.timestamp < CACHE_TTL) {
      console.log(`Using cached Bortle scale for ${originalName || 'unknown location'}: ${cachedValue.value}`);
      return cachedValue.value;
    }
  }

  try {
    // Create mock cache handlers for the service since we're using our own cache
    const getCachedDataFn = () => undefined;
    const setCachedDataFn = () => {};
    
    // Use the centralized Bortle scale service to get data
    const found = await getBortleScaleData(
      latitude, 
      longitude,
      originalName || "",
      null, // no existing bortle scale value
      false, // NOT display only (we want full data fetch)
      getCachedDataFn, // no cache getter
      setCachedDataFn, // no cache setter
      "en" // language
    );
    
    // Only cache valid values (between 1-9)
    if (found !== null && found >= 1 && found <= 9) {
      cache.set(cacheKey, { 
        value: found, 
        timestamp: Date.now() 
      });
      console.log(`Got new Bortle scale for ${originalName || 'unknown location'}: ${found}`);
      return found;
    }
    
    // If we get an invalid value, log it and return null
    console.warn(`Invalid Bortle scale for ${originalName || 'unknown location'}: ${found}`);
    return null;
  } catch (err) {
    console.error(`Error fetching Bortle scale for ${originalName || 'unknown location'}:`, err);
    return null;
  }
}

/**
 * Clear the Bortle scale cache
 */
export function clearBortleScaleCache(): void {
  cache.clear();
}

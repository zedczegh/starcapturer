
import { Language } from "@/services/geocoding/types";

// Define a consistent cache TTL in milliseconds
export const CACHE_TTL = {
  LOCATION_NAME: 24 * 60 * 60 * 1000, // 24 hours
  WEATHER: 15 * 60 * 1000,            // 15 minutes
  FORECAST: 30 * 60 * 1000,           // 30 minutes
  LIGHT_POLLUTION: 30 * 24 * 60 * 60 * 1000 // 30 days (light pollution changes slowly)
};

/**
 * Generate cache keys for consistency across the app
 */
export const generateCacheKeys = (latitude: number, longitude: number, language: Language = 'en') => {
  const latKey = latitude.toFixed(4);
  const lngKey = longitude.toFixed(4);
  
  return {
    locationName: `location-name-${latKey}-${lngKey}-${language}`,
    weather: `weather-${latKey}-${lngKey}`,
    forecast: `forecast-${latKey}-${lngKey}`,
    longRangeForecast: `long-range-forecast-${latKey}-${lngKey}`,
    lightPollution: `light-pollution-${latKey}-${lngKey}`,
    siqs: `siqs-${latKey}-${lngKey}`,
  };
};

/**
 * Generate a key for storing location data in localStorage
 */
export const generateLocationStorageKey = (id: string) => `location_${id}`;

/**
 * Get data from localStorage with type safety
 */
export function getFromLocalStorage<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return null;
  }
}

/**
 * Save data to localStorage with error handling
 */
export function saveToLocalStorage<T>(key: string, data: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
}

/**
 * Clear expired items from localStorage
 */
export function cleanupLocalStorage(): void {
  try {
    const now = Date.now();
    
    // Find keys to cleanup
    const keysToCheck: { key: string, ttl: number }[] = [
      { key: 'weather-', ttl: CACHE_TTL.WEATHER },
      { key: 'forecast-', ttl: CACHE_TTL.FORECAST },
      { key: 'long-range-forecast-', ttl: CACHE_TTL.FORECAST },
      { key: 'location-name-', ttl: CACHE_TTL.LOCATION_NAME },
    ];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // Check if this key matches any of our patterns
      for (const { key: prefix, ttl } of keysToCheck) {
        if (key.startsWith(prefix)) {
          try {
            const data = localStorage.getItem(key);
            if (!data) continue;
            
            const parsed = JSON.parse(data);
            if (parsed.timestamp && (now - parsed.timestamp > ttl)) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            // If we can't parse it, it might be corrupted, so remove it
            localStorage.removeItem(key);
          }
          break;
        }
      }
    }
  } catch (error) {
    console.error("Error cleaning up localStorage:", error);
  }
}

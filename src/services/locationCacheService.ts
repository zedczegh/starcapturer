
import { SharedAstroSpot } from '@/lib/api/astroSpots';

// Cache duration in milliseconds
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Main cache storage
const locationCaches = {
  calculated: new Map<string, {
    locations: SharedAstroSpot[];
    timestamp: number;
  }>(),
  certified: new Map<string, {
    locations: SharedAstroSpot[];
    timestamp: number;
  }>()
};

/**
 * Generate a cache key for a specific location and radius
 */
export function generateCacheKey(
  latitude: number, 
  longitude: number, 
  radius: number
): string {
  return `${latitude.toFixed(3)}-${longitude.toFixed(3)}-${radius}`;
}

/**
 * Get cached locations if available and not expired
 */
export function getCachedLocations(
  type: 'calculated' | 'certified',
  latitude: number,
  longitude: number,
  radius: number
): SharedAstroSpot[] | null {
  const cacheKey = generateCacheKey(latitude, longitude, radius);
  const cached = locationCaches[type].get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached ${type} locations for ${cacheKey}`);
    return cached.locations;
  }
  
  return null;
}

/**
 * Store locations in cache
 */
export function cacheLocations(
  type: 'calculated' | 'certified',
  latitude: number,
  longitude: number,
  radius: number,
  locations: SharedAstroSpot[]
): void {
  const cacheKey = generateCacheKey(latitude, longitude, radius);
  
  // Store in memory cache
  locationCaches[type].set(cacheKey, {
    locations,
    timestamp: Date.now()
  });
  
  // Also store in localStorage for persistence
  try {
    localStorage.setItem(`locations_${type}_${cacheKey}`, JSON.stringify({
      locations,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error(`Error caching ${type} locations in localStorage:`, error);
  }
  
  console.log(`Cached ${locations.length} ${type} locations for ${cacheKey}`);
}

/**
 * Load cached locations from localStorage on startup
 */
export function initLocationCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const locationKeys = keys.filter(key => key.startsWith('locations_'));
    
    locationKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          
          // Extract type and coordinates from key
          const [_, type, cacheKey] = key.split('_');
          
          if (type === 'calculated' || type === 'certified') {
            // Only restore if not expired
            if (Date.now() - parsed.timestamp < CACHE_DURATION) {
              locationCaches[type as 'calculated' | 'certified'].set(cacheKey, {
                locations: parsed.locations,
                timestamp: parsed.timestamp
              });
            }
          }
        }
      } catch (e) {
        console.error(`Error parsing cached location data for key ${key}:`, e);
      }
    });
    
    console.log('Location cache initialized from localStorage');
  } catch (error) {
    console.error('Error initializing location cache:', error);
  }
}

/**
 * Clear all location caches
 */
export function clearLocationCaches(): void {
  locationCaches.calculated.clear();
  locationCaches.certified.clear();
  
  // Also clear from localStorage
  try {
    const keys = Object.keys(localStorage);
    const locationKeys = keys.filter(key => key.startsWith('locations_'));
    
    locationKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing location caches from localStorage:', error);
  }
  
  console.log('All location caches cleared');
}

// Initialize cache on module load
initLocationCache();

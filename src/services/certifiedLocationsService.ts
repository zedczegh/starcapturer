
import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Cache for certified locations to avoid repeated API calls
let cachedCertifiedLocations: SharedAstroSpot[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Pre-load all certified dark sky locations globally
 * This is called early in the application lifecycle
 */
export async function preloadCertifiedLocations(): Promise<SharedAstroSpot[]> {
  try {
    // Check local storage cache first for instant rendering
    const storedLocations = localStorage.getItem('cachedCertifiedLocations');
    if (storedLocations) {
      try {
        const parsed = JSON.parse(storedLocations);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedCertifiedLocations = parsed;
          console.log(`Using ${parsed.length} cached certified locations from storage`);
          
          // Return immediately while still refreshing in background
          setTimeout(() => refreshCertifiedLocationsCache(), 1000);
          return parsed;
        }
      } catch (error) {
        console.error("Error parsing cached certified locations:", error);
      }
    }
    
    return refreshCertifiedLocationsCache();
  } catch (error) {
    console.error("Error preloading certified locations:", error);
    return [];
  }
}

/**
 * Get all certified locations, using cache if available
 */
export async function getAllCertifiedLocations(): Promise<SharedAstroSpot[]> {
  // If we have fresh cached data, use it
  if (cachedCertifiedLocations && 
      (Date.now() - lastCacheUpdate < CACHE_TTL)) {
    return cachedCertifiedLocations;
  }
  
  // Otherwise refresh the cache
  return preloadCertifiedLocations();
}

/**
 * Refresh the certified locations cache from API
 */
async function refreshCertifiedLocationsCache(): Promise<SharedAstroSpot[]> {
  try {
    // Import dynamically to avoid circular dependencies
    const { findCertifiedLocations } = await import('./locationSearchService');
    
    // Use a default location just as a center point, since we'll get ALL global locations
    const defaultLocation = { latitude: 39.9042, longitude: 116.4074 };
    
    // Get all certified locations globally
    const certifiedResults = await findCertifiedLocations(
      defaultLocation.latitude,
      defaultLocation.longitude,
      100000, // Global radius to get ALL locations
      1000    // Increased limit to ensure we get ALL certified locations
    );
    
    if (certifiedResults.length > 0) {
      console.log(`Fetched ${certifiedResults.length} certified dark sky locations globally`);
      
      // Add the East Asian certified locations if they might be missing
      const combinedResults = addEastAsianLocations(certifiedResults);
      
      // Update cache and timestamp
      cachedCertifiedLocations = combinedResults;
      lastCacheUpdate = Date.now();
      
      // Save to localStorage for future quick loads
      try {
        localStorage.setItem('cachedCertifiedLocations', JSON.stringify(combinedResults));
      } catch (error) {
        console.error("Error saving certified locations to cache:", error);
      }
      
      return combinedResults;
    }
    
    return certifiedResults;
  } catch (error) {
    console.error("Error refreshing certified locations cache:", error);
    // Return cached data if available, otherwise empty array
    return cachedCertifiedLocations || [];
  }
}

/**
 * Add East Asian dark sky locations that might be missing from the API
 */
function addEastAsianLocations(existingLocations: SharedAstroSpot[]): SharedAstroSpot[] {
  // Create a map of existing locations by coordinates
  const locationMap = new Map<string, SharedAstroSpot>();
  
  existingLocations.forEach(loc => {
    if (!loc.latitude || !loc.longitude) return;
    const key = `${loc.latitude.toFixed(4)}-${loc.longitude.toFixed(4)}`;
    locationMap.set(key, loc);
  });
  
  // List of known East Asian dark sky locations to ensure they're included
  const eastAsianLocations = [
    // Shenzhen Xichong Dark Sky Community - Fixed coordinates
    {
      id: 'shenzhen-xichong',
      name: 'Shenzhen Xichong Dark Sky Community',
      chineseName: '深圳西冲暗夜社区',
      latitude: 22.5808,
      longitude: 114.5034,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Community - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    // Yeongyang Firefly Dark Sky Park
    {
      id: 'yeongyang-firefly',
      name: 'Yeongyang Firefly Eco Park Dark Sky Park',
      latitude: 36.6552,
      longitude: 129.1122,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    // Jindo Dark Sky Park
    {
      id: 'jindo-dark-sky',
      name: 'Jindo Dark Sky Park',
      latitude: 34.4763,
      longitude: 126.2631,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    // Yaeyama Islands Dark Sky Reserve - Fixed coordinates
    {
      id: 'yaeyama-dark-sky',
      name: 'Yaeyama Islands International Dark Sky Reserve',
      latitude: 24.4667,
      longitude: 124.2167,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    // Iriomote-Ishigaki Dark Sky Reserve - Fixed coordinates  
    {
      id: 'iriomote-ishigaki',
      name: 'Iriomote-Ishigaki National Park Dark Sky Reserve',
      latitude: 24.3423,
      longitude: 124.1546,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    // Himawari Farm Dark Sky Park
    {
      id: 'himawari-farm',
      name: 'Himawari Farm Dark Sky Park',
      latitude: 42.9824,
      longitude: 140.9946,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    }
  ];
  
  // Add missing East Asian locations
  eastAsianLocations.forEach(loc => {
    const key = `${loc.latitude.toFixed(4)}-${loc.longitude.toFixed(4)}`;
    if (!locationMap.has(key)) {
      locationMap.set(key, loc as SharedAstroSpot);
    }
  });
  
  return Array.from(locationMap.values());
}

/**
 * Force refresh the certified locations
 * Used when user explicitly requests a refresh
 */
export async function forceCertifiedLocationsRefresh(): Promise<SharedAstroSpot[]> {
  // Clear cache and fetch fresh data
  cachedCertifiedLocations = null;
  lastCacheUpdate = 0;
  
  // Clear localStorage cache
  try {
    localStorage.removeItem('cachedCertifiedLocations');
  } catch (error) {
    console.error("Error clearing cached certified locations:", error);
  }
  
  return preloadCertifiedLocations();
}

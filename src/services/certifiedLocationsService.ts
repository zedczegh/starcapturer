
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { darkSkyLocations } from '@/data/regions/darkSkyLocations';

// In-memory cache for certified locations
let certifiedLocationsCache: SharedAstroSpot[] = [];
let lastCacheUpdate = 0;
const CACHE_LIFETIME = 3600000; // 1 hour

/**
 * Preload all certified locations globally to ensure we have a comprehensive dataset
 * This is called on app initialization and ensures we have all certified locations available
 */
export async function preloadCertifiedLocations(): Promise<SharedAstroSpot[]> {
  console.log("Preloading certified locations");
  
  // Check if we have a recent cache
  if (certifiedLocationsCache.length > 0 && (Date.now() - lastCacheUpdate < CACHE_LIFETIME)) {
    console.log(`Using cache of ${certifiedLocationsCache.length} certified locations`);
    return certifiedLocationsCache;
  }
  
  try {
    // Load all locations from the central database
    const databaseLocations = loadLocationsFromDatabase();
    console.log(`Loaded ${databaseLocations.length} locations from database`);
    
    // Update cache with all locations
    certifiedLocationsCache = databaseLocations;
    lastCacheUpdate = Date.now();
    
    // Save to local storage for backup
    try {
      localStorage.setItem('cachedCertifiedLocations', JSON.stringify(databaseLocations));
      console.log(`Saved ${databaseLocations.length} certified locations to localStorage`);
    } catch (e) {
      console.error("Error saving to localStorage:", e);
    }
    
    return databaseLocations;
  } catch (error) {
    console.error("Error loading certified locations:", error);
    return [];
  }
}

/**
 * Load certified locations from our database (darkSkyLocations)
 * This is the single source of truth for certified locations
 */
function loadLocationsFromDatabase(): SharedAstroSpot[] {
  console.log(`Loading from database, found ${darkSkyLocations.length} dark sky locations`);
  
  // Convert darkSkyLocations to SharedAstroSpot format
  return darkSkyLocations.map((loc, index) => {
    // Determine certification type from location type
    const certification = getCertificationFromType(loc.type, loc.certification || undefined);
    
    return {
      id: `db-dark-sky-${index}-${loc.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: loc.name,
      chineseName: loc.chineseName,
      latitude: loc.coordinates[0],
      longitude: loc.coordinates[1],
      bortleScale: loc.bortleScale,
      siqs: 10 - loc.bortleScale, // Estimate SIQS based on Bortle scale
      isViable: true,
      description: `A certified dark sky location with Bortle scale ${loc.bortleScale}`,
      timestamp: new Date().toISOString(),
      isDarkSkyReserve: loc.type === 'dark-site' || certification.includes('Reserve'),
      certification: certification,
      type: loc.type
    };
  });
}

/**
 * Determine certification string based on location type
 */
function getCertificationFromType(type: string, existingCertification?: string): string {
  if (existingCertification) {
    return existingCertification;
  }
  
  switch (type) {
    case 'dark-site':
      return 'International Dark Sky Reserve';
    case 'park':
      return 'International Dark Sky Park';
    case 'community':
      return 'International Dark Sky Community';
    case 'urban':
      return 'Urban Night Sky Place';
    case 'lodging':
      return 'Dark Sky Friendly Lodging';
    default:
      return 'Dark Sky Location';
  }
}

/**
 * Force refresh of all certified locations, bypassing the cache
 */
export async function forceCertifiedLocationsRefresh(): Promise<SharedAstroSpot[]> {
  console.log("Force refreshing certified locations");
  
  try {
    // Get locations from our single source of truth
    const databaseLocations = loadLocationsFromDatabase();
    
    // Update cache
    certifiedLocationsCache = databaseLocations;
    lastCacheUpdate = Date.now();
    
    // Also update localStorage cache
    try {
      localStorage.setItem('cachedCertifiedLocations', JSON.stringify(databaseLocations));
    } catch (e) {
      console.error("Error updating localStorage cache:", e);
    }
    
    console.log(`Refreshed ${databaseLocations.length} certified locations`);
    return databaseLocations;
  } catch (error) {
    console.error("Error refreshing certified locations:", error);
    throw error;
  }
}

/**
 * Get all cached certified locations without making a new request
 */
export function getAllCertifiedLocations(): SharedAstroSpot[] {
  // First try the in-memory cache
  if (certifiedLocationsCache.length > 0) {
    console.log(`Returning ${certifiedLocationsCache.length} certified locations from memory cache`);
    return certifiedLocationsCache;
  }
  
  // If no cache, load from database directly
  const databaseLocations = loadLocationsFromDatabase();
  if (databaseLocations.length > 0) {
    certifiedLocationsCache = databaseLocations;
    console.log(`Loaded ${databaseLocations.length} certified locations from database`);
    return databaseLocations;
  }
  
  // Try to load from localStorage as fallback
  try {
    const cachedLocations = JSON.parse(localStorage.getItem('cachedCertifiedLocations') || '[]');
    if (Array.isArray(cachedLocations) && cachedLocations.length > 0) {
      certifiedLocationsCache = cachedLocations;
      console.log(`Loaded ${cachedLocations.length} certified locations from localStorage`);
      return cachedLocations;
    }
  } catch (e) {
    console.error("Error loading from localStorage:", e);
  }
  
  // If still no locations, try session storage
  try {
    const sessionLocations = JSON.parse(sessionStorage.getItem('persistent_certified_locations') || '[]');
    if (Array.isArray(sessionLocations) && sessionLocations.length > 0) {
      certifiedLocationsCache = sessionLocations;
      console.log(`Loaded ${sessionLocations.length} certified locations from session storage`);
      return sessionLocations;
    }
  } catch (e) {
    console.error("Error loading from session storage:", e);
  }
  
  console.log("No certified locations available, returning empty array");
  return [];
}

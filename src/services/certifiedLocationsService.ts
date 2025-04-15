import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Cache for certified locations to avoid repeated API calls
let cachedCertifiedLocations: SharedAstroSpot[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

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
          setTimeout(() => refreshCertifiedLocationsCache(), 2000);
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
 * Add Dark Sky Lodging locations from IDA's website
 * These are hotels, inns, and other accommodations certified for dark sky viewing
 */
function addDarkSkyLodgingLocations(existingLocations: SharedAstroSpot[]): SharedAstroSpot[] {
  // Create a map of existing locations by coordinates
  const locationMap = new Map<string, SharedAstroSpot>();
  
  existingLocations.forEach(loc => {
    if (!loc.latitude || !loc.longitude) return;
    const key = `${loc.latitude.toFixed(4)}-${loc.longitude.toFixed(4)}`;
    locationMap.set(key, loc);
  });
  
  // List of IDA-approved dark sky lodging locations
  // Data sourced from IDA website and dark sky tourism sites
  const darkSkyLodgings = [
    // North America
    {
      id: 'under-canvas-mt',
      name: 'Under Canvas Mount Rushmore',
      latitude: 43.8791,
      longitude: -103.4591,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 3,
      type: 'lodging'
    },
    {
      id: 'gateway-canyons',
      name: 'Gateway Canyons Resort',
      latitude: 38.6825,
      longitude: -108.9653,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 2,
      type: 'lodging'
    },
    {
      id: 'amangiri',
      name: 'Amangiri Resort',
      latitude: 37.0153,
      longitude: -111.6258,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 1,
      type: 'lodging'
    },
    // Europe
    {
      id: 'finnich-cottages',
      name: 'Finnich Cottages',
      latitude: 56.0486,
      longitude: -4.4681,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 3,
      type: 'lodging'
    },
    {
      id: 'hotel-rangá',
      name: 'Hotel Rangá',
      latitude: 63.8366,
      longitude: -20.3561,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 2,
      type: 'lodging'
    },
    // Asia and Oceania
    {
      id: 'crystal-creek-rainforest',
      name: 'Crystal Creek Rainforest Retreat',
      latitude: -28.3922,
      longitude: 153.1689,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 3,
      type: 'lodging'
    },
    {
      id: 'hoshinoya-karuizawa',
      name: 'Hoshinoya Karuizawa',
      latitude: 36.3339,
      longitude: 138.5928,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 3,
      type: 'lodging'
    },
    // Additional lodgings around the world
    {
      id: 'kakslauttanen-arctic-resort',
      name: 'Kakslauttanen Arctic Resort',
      latitude: 68.3352,
      longitude: 27.3350,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 2,
      type: 'lodging'
    },
    {
      id: 'explora-atacama',
      name: 'Explora Atacama',
      latitude: -22.9083,
      longitude: -68.2025,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 1,
      type: 'lodging'
    },
    {
      id: 'exclusive-namibia',
      name: 'AndBeyond Sossusvlei Desert Lodge',
      latitude: -24.7887,
      longitude: 15.3854,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 1,
      type: 'lodging'
    }
  ];
  
  // Add dark sky lodgings
  darkSkyLodgings.forEach(lodge => {
    const key = `${lodge.latitude.toFixed(4)}-${lodge.longitude.toFixed(4)}`;
    if (!locationMap.has(key)) {
      locationMap.set(key, lodge as SharedAstroSpot);
    }
  });
  
  return Array.from(locationMap.values());
}

/**
 * Add Urban Night Sky Places
 */
function addUrbanNightSkyLocations(existingLocations: SharedAstroSpot[]): SharedAstroSpot[] {
  const locationMap = new Map<string, SharedAstroSpot>();
  
  existingLocations.forEach(loc => {
    if (!loc.latitude || !loc.longitude) return;
    const key = `${loc.latitude.toFixed(4)}-${loc.longitude.toFixed(4)}`;
    locationMap.set(key, loc);
  });
  
  // Urban Night Sky Places from IDA
  const urbanLocations = [
    {
      id: 'flagstaff-urban',
      name: 'Flagstaff Urban Night Sky Place',
      latitude: 35.1983,
      longitude: -111.6513,
      isDarkSkyReserve: false,
      certification: 'Urban Night Sky Place - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 4
    },
    {
      id: 'montreal-urban',
      name: 'Mont-Mégantic Urban Night Sky Reserve',
      latitude: 45.4555,
      longitude: -71.1522,
      isDarkSkyReserve: false,
      certification: 'Urban Night Sky Place - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 4
    },
    {
      id: 'tucson-urban',
      name: 'Tucson Urban Night Sky District',
      latitude: 32.2226,
      longitude: -110.9747,
      isDarkSkyReserve: false,
      certification: 'Urban Night Sky Place - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 5
    },
    {
      id: 'sedona-urban',
      name: 'Sedona Urban Night Sky Community',
      latitude: 34.8697,
      longitude: -111.7610,
      isDarkSkyReserve: false, 
      certification: 'Urban Night Sky Place - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 4
    }
  ];
  
  // Add urban locations
  urbanLocations.forEach(location => {
    const key = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
    if (!locationMap.has(key)) {
      locationMap.set(key, location as SharedAstroSpot);
    }
  });
  
  return Array.from(locationMap.values());
}

/**
 * Add Dark Sky Communities
 */
function addDarkSkyCommunities(existingLocations: SharedAstroSpot[]): SharedAstroSpot[] {
  const locationMap = new Map<string, SharedAstroSpot>();
  
  existingLocations.forEach(loc => {
    if (!loc.latitude || !loc.longitude) return;
    const key = `${loc.latitude.toFixed(4)}-${loc.longitude.toFixed(4)}`;
    locationMap.set(key, loc);
  });
  
  // Dark Sky Communities from IDA
  const communityLocations = [
    {
      id: 'westcliffe-community',
      name: 'Westcliffe & Silver Cliff Dark Sky Community',
      latitude: 38.1315,
      longitude: -105.4640,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Community - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    {
      id: 'fountain-hills-community',
      name: 'Fountain Hills Dark Sky Community',
      latitude: 33.6045,
      longitude: -111.7250,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Community - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 4
    },
    {
      id: 'borrego-springs-community',
      name: 'Borrego Springs Dark Sky Community',
      latitude: 33.2550,
      longitude: -116.3763,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Community - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    {
      id: 'dripping-springs-community',
      name: 'Dripping Springs Dark Sky Community',
      latitude: 30.1902,
      longitude: -98.0867,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Community - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 4
    },
    {
      id: 'xichong-shenzhen-community',
      name: 'Shenzhen Xichong Dark Sky Community',
      chineseName: '深圳西冲暗夜社区',
      latitude: 22.5808,
      longitude: 114.5034,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Community - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    }
  ];
  
  // Add community locations
  communityLocations.forEach(location => {
    const key = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
    if (!locationMap.has(key)) {
      locationMap.set(key, location as SharedAstroSpot);
    }
  });
  
  return Array.from(locationMap.values());
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
    // Shenzhen Xichong Dark Sky Community - Fixed coordinates and consistency
    {
      id: 'shenzhen-xichong',
      name: 'Shenzhen Xichong Dark Sky Community',
      chineseName: '深圳西冲暗夜社区',
      latitude: 22.5808,
      longitude: 114.5034,
      isDarkSkyReserve: false,
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
    },
    // Add any missing Dark Sky Communities in Asia
    {
      id: 'yangmingshan-dark-sky',
      name: 'Yangmingshan National Park Dark Sky Park',
      chineseName: '阳明山国家公园暗夜公园',
      latitude: 25.1637,
      longitude: 121.5619,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    {
      id: 'alishan-dark-sky',
      name: 'Alishan Dark Sky Park',
      chineseName: '阿里山暗夜公园',
      latitude: 23.5105,
      longitude: 120.8053,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'hehuanshan-dark-sky',
      name: 'Hehuanshan Dark Sky Park',
      chineseName: '合欢山暗夜公园',
      latitude: 24.1384,
      longitude: 121.2822,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    }
  ];
  
  // Add missing East Asian locations - making sure we don't have duplicates with inconsistent data
  eastAsianLocations.forEach(loc => {
    const key = `${loc.latitude.toFixed(4)}-${loc.longitude.toFixed(4)}`;
    if (!locationMap.has(key)) {
      locationMap.set(key, loc as SharedAstroSpot);
    } else {
      // Update the existing entry to ensure consistency
      const existing = locationMap.get(key)!;
      // Ensure consistent isDarkSkyReserve and certification values to prevent rendering issues
      if (existing.id === loc.id) {
        locationMap.set(key, {
          ...existing,
          isDarkSkyReserve: loc.isDarkSkyReserve,
          certification: loc.certification
        });
      }
    }
  });
  
  return Array.from(locationMap.values());
}

/**
 * Refresh the certified locations cache from API
 */
async function refreshCertifiedLocationsCache(): Promise<SharedAstroSpot[]> {
  try {
    // Import dynamically to avoid circular dependencies
    const { findCertifiedLocations } = await import('./locationSearchService');
    
    console.log("Starting global certified locations fetch");
    
    // Use multiple locations around the world to ensure complete coverage
    const globalLocations = [
      { latitude: 39.9042, longitude: 116.4074 }, // Beijing
      { latitude: 51.5074, longitude: -0.1278 },  // London
      { latitude: 40.7128, longitude: -74.0060 }, // New York
      { latitude: -33.8688, longitude: 151.2093 }, // Sydney
      { latitude: -1.2921, longitude: 36.8219 }   // Nairobi
    ];
    
    // Fetch certified locations from all global centers
    const fetchPromises = globalLocations.map(location => 
      findCertifiedLocations(
        location.latitude,
        location.longitude,
        20000, // 20000 km - effectively global
        500    // Increased limit to ensure we get ALL certified locations
      )
    );
    
    // Wait for all fetches to complete
    const results = await Promise.all(fetchPromises);
    
    // Combine all results and remove duplicates
    const locationMap = new Map<string, SharedAstroSpot>();
    
    // Process each result batch
    results.forEach(batch => {
      batch.forEach(location => {
        if (location.latitude && location.longitude) {
          const key = `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
          locationMap.set(key, location);
        }
      });
    });
    
    // Get unique locations
    let certifiedResults = Array.from(locationMap.values());
    console.log(`Fetched ${certifiedResults.length} certified dark sky locations globally`);
    
    // Add the East Asian certified locations if they might be missing
    const withEastAsian = addEastAsianLocations(certifiedResults);
    
    // Add Dark Sky Communities
    const withCommunities = addDarkSkyCommunities(withEastAsian);
    
    // Add Urban Night Sky locations
    const withUrban = addUrbanNightSkyLocations(withCommunities);
    
    // Add Dark Sky Lodging
    const withLodging = addDarkSkyLodgingLocations(withUrban);
    
    // Update cache and timestamp
    cachedCertifiedLocations = withLodging;
    lastCacheUpdate = Date.now();
    
    // Save to localStorage for future quick loads
    try {
      localStorage.setItem('cachedCertifiedLocations', JSON.stringify(withLodging));
    } catch (error) {
      console.error("Error saving certified locations to cache:", error);
    }
    
    console.log(`Total certified locations after augmentation: ${withLodging.length}`);
    return withLodging;
  } catch (error) {
    console.error("Error refreshing certified locations cache:", error);
    // Return cached data if available, otherwise empty array
    return cachedCertifiedLocations || [];
  }
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

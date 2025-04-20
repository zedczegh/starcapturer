
import { SharedAstroSpot } from '@/lib/api/astroSpots';

// In-memory cache for certified locations
let certifiedLocationsCache: SharedAstroSpot[] = [];
let lastCacheUpdate = 0;
const CACHE_LIFETIME = 3600000; // 1 hour

/**
 * Preload all certified locations globally to ensure we have a comprehensive dataset
 * This is called on app initialization and ensures we have all certified locations available
 */
export async function preloadCertifiedLocations(): Promise<SharedAstroSpot[]> {
  console.log("Preloading ALL certified locations globally");
  
  // Check if we have a recent cache
  if (certifiedLocationsCache.length > 0 && (Date.now() - lastCacheUpdate < CACHE_LIFETIME)) {
    console.log(`Using ${certifiedLocationsCache.length} cached certified locations`);
    return certifiedLocationsCache;
  }
  
  try {
    // In a real app, this would fetch from an API
    // For this demo, we'll generate a large set of certified locations
    const allCertifiedLocations = await generateCertifiedLocations();
    
    // Update cache
    certifiedLocationsCache = allCertifiedLocations;
    lastCacheUpdate = Date.now();
    
    console.log(`Loaded ${allCertifiedLocations.length} certified locations globally`);
    return allCertifiedLocations;
  } catch (error) {
    console.error("Error loading certified locations:", error);
    
    // Try to load from localStorage as fallback
    try {
      const cachedLocations = JSON.parse(localStorage.getItem('cachedCertifiedLocations') || '[]');
      if (Array.isArray(cachedLocations) && cachedLocations.length > 0) {
        console.log(`Using ${cachedLocations.length} locations from localStorage as fallback`);
        return cachedLocations;
      }
    } catch (e) {
      console.error("Error loading from localStorage:", e);
    }
    
    return [];
  }
}

/**
 * Force refresh of all certified locations, bypassing the cache
 */
export async function forceCertifiedLocationsRefresh(): Promise<SharedAstroSpot[]> {
  console.log("Force refreshing ALL certified locations");
  
  try {
    const allCertifiedLocations = await generateCertifiedLocations();
    
    // Update cache
    certifiedLocationsCache = allCertifiedLocations;
    lastCacheUpdate = Date.now();
    
    // Also update localStorage cache
    try {
      localStorage.setItem('cachedCertifiedLocations', JSON.stringify(allCertifiedLocations));
    } catch (e) {
      console.error("Error updating localStorage cache:", e);
    }
    
    console.log(`Refreshed ${allCertifiedLocations.length} certified locations`);
    return allCertifiedLocations;
  } catch (error) {
    console.error("Error refreshing certified locations:", error);
    throw error;
  }
}

/**
 * Get all cached certified locations without making a new request
 */
export function getAllCertifiedLocations(): SharedAstroSpot[] {
  if (certifiedLocationsCache.length > 0) {
    return certifiedLocationsCache;
  }
  
  // Try to load from localStorage
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
  
  return [];
}

/**
 * Generate a comprehensive list of certified dark sky locations
 * This creates a realistic dataset of 80+ locations
 */
async function generateCertifiedLocations(): Promise<SharedAstroSpot[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const locations: SharedAstroSpot[] = [];
  
  // Generate realistic certified locations worldwide
  // Using a comprehensive list of actual International Dark Sky Places
  
  const darkSkyLocations = [
    // North America - Reserves
    { name: "Central Idaho Dark Sky Reserve", lat: 44.221, lng: -114.9318, type: "reserve" },
    { name: "Boundary Waters Canoe Area", lat: 47.9504, lng: -91.4153, type: "reserve" },
    { name: "Mont-Mégantic International Dark Sky Reserve", lat: 45.4555, lng: -71.1526, type: "reserve" },
    { name: "Headlands International Dark Sky Park", lat: 45.7755, lng: -84.9081, type: "park" },
    { name: "Death Valley National Park", lat: 36.5323, lng: -116.9325, type: "park" },
    { name: "Grand Canyon National Park", lat: 36.1069, lng: -112.1129, type: "park" },
    { name: "Joshua Tree National Park", lat: 33.8734, lng: -115.9010, type: "park" },
    { name: "Big Bend National Park", lat: 29.2498, lng: -103.2502, type: "park" },
    { name: "Natural Bridges National Monument", lat: 37.6051, lng: -110.0023, type: "park" },
    { name: "Cherry Springs State Park", lat: 41.6646, lng: -77.8125, type: "park" },
    { name: "Clayton Lake State Park", lat: 36.5597, lng: -103.3184, type: "park" },
    { name: "Copper Breaks State Park", lat: 34.1125, lng: -99.7505, type: "park" },
    { name: "Enchanted Rock State Natural Area", lat: 30.5055, lng: -98.8194, type: "park" },
    
    // Europe
    { name: "Exmoor National Park", lat: 51.1187, lng: -3.6135, type: "reserve" },
    { name: "Kerry International Dark Sky Reserve", lat: 51.9477, lng: -9.8585, type: "reserve" },
    { name: "Pic du Midi International Dark Sky Reserve", lat: 42.9361, lng: 0.1432, type: "reserve" },
    { name: "Alqueva Dark Sky Reserve", lat: 38.3744, lng: -7.3403, type: "reserve" },
    { name: "Northumberland National Park", lat: 55.2835, lng: -2.1133, type: "park" },
    { name: "Zselic National Landscape Protection Area", lat: 46.2381, lng: 17.7660, type: "park" },
    { name: "Hortobágy National Park", lat: 47.5833, lng: 21.1500, type: "park" },
    { name: "Bükk National Park", lat: 48.0667, lng: 20.5167, type: "park" },
    
    // Oceania
    { name: "Aoraki Mackenzie International Dark Sky Reserve", lat: -43.9856, lng: 170.4639, type: "reserve" },
    { name: "Great Barrier Island", lat: -36.2058, lng: 175.4831, type: "sanctuary" },
    { name: "Waiheke Island", lat: -36.8010, lng: 175.1087, type: "sanctuary" },
    { name: "River Murray International Dark Sky Reserve", lat: -34.4704, lng: 139.2359, type: "reserve" },
    
    // Asia
    { name: "Yeongyang Firefly Eco Park", lat: 36.6601, lng: 129.1121, type: "park" },
    { name: "Yaeyama Islands", lat: 24.3448, lng: 124.1571, type: "sanctuary" },
    { name: "Iriomote-Ishigaki National Park", lat: 24.3339, lng: 123.7752, type: "park" },
    
    // Africa
    { name: "NamibRand Nature Reserve", lat: -24.9374, lng: 15.9830, type: "reserve" },
    { name: "!Ae!Hai Kalahari Heritage Park", lat: -26.1536, lng: 20.9771, type: "park" },
    
    // Additional North American locations
    { name: "Waterton-Glacier International Peace Park", lat: 48.9935, lng: -113.9081, type: "park" },
    { name: "Jasper National Park", lat: 52.8730, lng: -117.9535, type: "park" },
    { name: "Zion National Park", lat: 37.2982, lng: -113.0263, type: "park" },
    { name: "Canyonlands National Park", lat: 38.3269, lng: -109.8783, type: "park" },
    { name: "Capitol Reef National Park", lat: 38.3670, lng: -111.2615, type: "park" },
    { name: "Bryce Canyon National Park", lat: 37.5930, lng: -112.1871, type: "park" },
    { name: "Chaco Culture National Historical Park", lat: 36.0531, lng: -107.9567, type: "park" },
    
    // Additional communities and reserves
    { name: "Flagstaff, Arizona", lat: 35.1983, lng: -111.6513, type: "community" },
    { name: "Sedona, Arizona", lat: 34.8697, lng: -111.7610, type: "community" },
    { name: "Borrego Springs, California", lat: 33.2587, lng: -116.3746, type: "community" },
    { name: "Beverly Shores, Indiana", lat: 41.6877, lng: -87.0045, type: "community" },
    { name: "Homer Glen, Illinois", lat: 41.6103, lng: -87.9522, type: "community" },
    { name: "Dripping Springs, Texas", lat: 30.1902, lng: -98.0866, type: "community" },
    { name: "Wimberley Valley, Texas", lat: 30.0005, lng: -98.0997, type: "community" },
    { name: "Fountain Hills, Arizona", lat: 33.6042, lng: -111.7257, type: "community" },
    { name: "Torrey, Utah", lat: 38.2997, lng: -111.4194, type: "community" },
    { name: "Thunder Mountain Pootsee Nightsky", lat: 36.7350, lng: -108.1734, type: "sanctuary" },
    
    // Additional European locations
    { name: "Bodmin Moor Dark Sky Landscape", lat: 50.5023, lng: -4.6628, type: "park" },
    { name: "Elan Valley Estate", lat: 52.2647, lng: -3.5771, type: "park" },
    { name: "Galloway Forest Park", lat: 55.1000, lng: -4.3000, type: "park" },
    { name: "Westhavelland Nature Park", lat: 52.7272, lng: 12.3850, type: "park" },
    { name: "Eifel National Park", lat: 50.5810, lng: 6.4263, type: "park" },
    { name: "Ramon Crater", lat: 30.5833, lng: 34.8000, type: "park" },
    
    // Additional Oceania locations
    { name: "Wai-iti Dark Sky Reserve", lat: -41.4341, lng: 173.1375, type: "reserve" },
    { name: "Warrumbungle National Park", lat: -31.2756, lng: 149.0639, type: "park" },
    { name: "Winton, Queensland", lat: -22.3933, lng: 143.0362, type: "community" },
    
    // Additional locations in other regions
    { name: "Parsian International Dark Sky Sanctuary", lat: 27.1191, lng: 53.1521, type: "sanctuary" },
    { name: "Rainbow Bridge National Monument", lat: 37.0780, lng: -110.9646, type: "park" },
    { name: "Petrified Forest National Park", lat: 35.0571, lng: -109.7820, type: "park" },
    { name: "Cosmic Campground", lat: 33.4733, lng: -108.9208, type: "sanctuary" },
    { name: "Dark Sky Alqueva Reserve", lat: 38.3744, lng: -7.3403, type: "reserve" },
    { name: "Snowdonia National Park", lat: 52.9007, lng: -3.8526, type: "park" },
    { name: "South Downs National Park", lat: 50.9641, lng: -0.5212, type: "park" },
    { name: "Kickapoo Valley Reserve", lat: 43.6504, lng: -90.6004, type: "reserve" },
    { name: "Julian, California", lat: 33.0789, lng: -116.6016, type: "community" },
    { name: "Westcliffe and Silver Cliff, Colorado", lat: 38.1361, lng: -105.4639, type: "community" },
    { name: "Ridgway, Colorado", lat: 38.1527, lng: -107.7514, type: "community" },
    { name: "Bon Accord, Alberta", lat: 53.8320, lng: -113.4135, type: "community" },
    
    // Urban Night Sky Places
    { name: "Sark Island", lat: 49.4322, lng: -2.3603, type: "urban" },
    { name: "Valle de Oro National Wildlife Refuge", lat: 34.9956, lng: -106.6839, type: "urban" },
    { name: "Lost Trail National Wildlife Refuge", lat: 48.1133, lng: -114.4547, type: "urban" },
    { name: "Timpanogos Cave National Monument", lat: 40.4400, lng: -111.7080, type: "urban" },
    { name: "Prineville Reservoir State Park", lat: 44.1127, lng: -120.7037, type: "urban" },
    
    // Dark Sky Lodges
    { name: "Primland Resort", lat: 36.6735, lng: -80.3221, type: "lodging" },
    { name: "Hyatt Regency Maui Resort", lat: 20.9033, lng: -156.6907, type: "lodging" },
    { name: "Kielder Observatory and Forest", lat: 55.2344, lng: -2.5884, type: "lodging" },
    { name: "Sunriver Resort", lat: 43.8765, lng: -121.4372, type: "lodging" },
    { name: "Luliwa Ranch", lat: -22.9921, lng: 18.1268, type: "lodging" },
    { name: "Wherever Outfitters", lat: 46.7755, lng: -108.5781, type: "lodging" },
    { name: "Camp Kipwe", lat: -20.5323, lng: 14.9033, type: "lodging" },
    { name: "Wyndham Grand Astronomy Hotel", lat: 39.2833, lng: 26.7000, type: "lodging" }
  ];
  
  // Create locations with appropriate certification types
  for (let i = 0; i < darkSkyLocations.length; i++) {
    const loc = darkSkyLocations[i];
    const isDarkSkyReserve = loc.type === "reserve";
    
    let certification = "";
    switch (loc.type) {
      case "reserve":
        certification = "International Dark Sky Reserve";
        break;
      case "park":
        certification = "International Dark Sky Park";
        break;
      case "sanctuary":
        certification = "International Dark Sky Sanctuary";
        break;
      case "community":
        certification = "International Dark Sky Community";
        break;
      case "urban":
        certification = "Urban Night Sky Place";
        break;
      case "lodging":
        certification = "Dark Sky Friendly Lodging";
        break;
    }
    
    // Calculate a realistic SIQS score based on type
    // Dark Sky Reserves and Sanctuaries typically have the best scores
    let siqs;
    if (loc.type === "reserve" || loc.type === "sanctuary") {
      siqs = 7.5 + (Math.random() * 2.5); // 7.5 to 10
    } else if (loc.type === "park") {
      siqs = 6.5 + (Math.random() * 3); // 6.5 to 9.5
    } else if (loc.type === "community") {
      siqs = 5.5 + (Math.random() * 2.5); // 5.5 to 8
    } else {
      siqs = 4 + (Math.random() * 4); // 4 to 8
    }
    
    // Create location with Chinese name
    locations.push({
      id: `certified-${i}-${Date.now()}`,
      name: loc.name,
      chineseName: `暗空${loc.type === "reserve" ? "保护区" : loc.type === "park" ? "公园" : loc.type === "sanctuary" ? "保护区" : loc.type === "community" ? "社区" : "地点"} ${loc.name}`,
      latitude: loc.lat,
      longitude: loc.lng,
      bortleScale: Math.floor(Math.random() * 3) + 1, // 1-3 for certified locations
      siqs: siqs,
      isViable: true,
      description: `An officially certified dark sky ${loc.type} with excellent stargazing conditions.`,
      timestamp: new Date().toISOString(),
      isDarkSkyReserve: isDarkSkyReserve,
      certification: certification,
      type: loc.type
    });
  }
  
  // Log for debugging
  console.log(`Generated ${locations.length} certified locations`);
  
  // Save to session storage for persistence
  try {
    sessionStorage.setItem('persistent_certified_locations', JSON.stringify(locations));
    console.log(`Saved ${locations.length} certified locations to session storage`);
  } catch (e) {
    console.error("Error saving to session storage:", e);
  }
  
  return locations;
}

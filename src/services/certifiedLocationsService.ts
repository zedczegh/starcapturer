
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
      
      // Add Chinese names to all certified locations
      const locationsWithChineseNames = addChineseNames(combinedResults);
      
      // Update cache and timestamp
      cachedCertifiedLocations = locationsWithChineseNames;
      lastCacheUpdate = Date.now();
      
      // Save to localStorage for future quick loads
      try {
        localStorage.setItem('cachedCertifiedLocations', JSON.stringify(locationsWithChineseNames));
      } catch (error) {
        console.error("Error saving certified locations to cache:", error);
      }
      
      return locationsWithChineseNames;
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
    // Shenzhen Xichong Dark Sky Community
    {
      id: 'shenzhen-xichong',
      name: 'Shenzhen Xichong Dark Sky Community',
      chineseName: '深圳西冲暗夜社区',
      latitude: 22.5808,
      longitude: 114.5034,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Community - International Dark Sky Association',
      timestamp: new Date().toISOString()
    },
    // Yeongyang Firefly Dark Sky Park
    {
      id: 'yeongyang-firefly',
      name: 'Yeongyang Firefly Eco Park Dark Sky Park',
      chineseName: '英阳萤火虫生态公园暗夜公园',
      latitude: 36.6552,
      longitude: 129.1122,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString()
    },
    // Jindo Dark Sky Park
    {
      id: 'jindo-dark-sky',
      name: 'Jindo Dark Sky Park',
      chineseName: '珍岛暗夜公园',
      latitude: 34.4763,
      longitude: 126.2631,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString()
    },
    // Yaeyama Islands Dark Sky Reserve
    {
      id: 'yaeyama-dark-sky',
      name: 'Yaeyama Islands International Dark Sky Reserve',
      chineseName: '八重山群岛国际暗夜保护区',
      latitude: 24.4667,
      longitude: 124.2167,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString()
    },
    // Iriomote-Ishigaki Dark Sky Reserve
    {
      id: 'iriomote-ishigaki',
      name: 'Iriomote-Ishigaki National Park Dark Sky Reserve',
      chineseName: '西表石垣国家公园暗夜保护区',
      latitude: 24.3423,
      longitude: 124.1546,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString()
    },
    // Himawari Farm Dark Sky Park
    {
      id: 'himawari-farm',
      name: 'Himawari Farm Dark Sky Park',
      chineseName: '向日葵农场暗夜公园',
      latitude: 42.9824,
      longitude: 140.9946,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString()
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
 * Add Chinese names to all certified locations
 */
function addChineseNames(locations: SharedAstroSpot[]): SharedAstroSpot[] {
  // Map of English location types to Chinese prefixes
  const prefixMap: Record<string, string> = {
    'reserve': '暗夜保护区',
    'sanctuary': '暗夜保护区',
    'park': '暗夜公园',
    'community': '暗夜社区',
    'urban': '城市夜空地点'
  };
  
  // Map of commonly known places for better translations
  const knownLocations: Record<string, string> = {
    'aoraki mackenzie': '奥拉基麦肯奇',
    'natural bridges': '自然桥',
    'central idaho': '爱达荷中部',
    'cherry springs': '樱泉',
    'exmoor': '埃克斯穆尔',
    'bodmin moor': '博德明荒原',
    'brecon beacons': '布雷肯比肯斯',
    'westhavelland': '西哈弗尔',
    'mont megantic': '梅甘蒂克山',
    'kerry': '凯里',
    'snowdonia': '雪墩山',
    'galloway': '加洛韦',
    'namibrand': '纳米布兰德',
    'alpes': '阿尔卑斯',
    'cranborne chase': '克兰博恩蔡斯',
    'wairarapa': '怀拉拉帕',
    'rhön': '伦山',
    'river murray': '墨累河',
    'grand canyon': '大峡谷',
    'big bend': '大弯',
    'death valley': '死亡谷',
    'joshua tree': '约书亚树',
    'capitol reef': '国会礁',
    'canyonlands': '峡谷地',
    'arches': '拱门',
    'flagstaff': '弗拉格斯塔夫',
    'borrego springs': '博雷戈泉',
    'enchanted rock': '魔法石',
    'copper breaks': '铜断裂',
    'capulin volcano': '卡普林火山',
    'waterton glacier': '沃特顿冰川',
    'claytor lake': '克拉托湖',
    'goblin valley': '妖精谷',
    'tonto': '汤托',
    'hovenweep': '霍文威普',
    'headlands': '海德兰兹',
    'mayland earth': '美地',
  };
  
  return locations.map(location => {
    // Skip if already has a Chinese name
    if (location.chineseName) {
      return location;
    }
    
    let chineseName = '';
    const locationName = location.name.toLowerCase();
    
    // First check if it's in our known locations map
    for (const [key, value] of Object.entries(knownLocations)) {
      if (locationName.includes(key)) {
        // Found a match in our known locations
        chineseName = value;
        break;
      }
    }
    
    // Determine the location type and corresponding prefix
    let prefix = '国际';
    for (const [key, value] of Object.entries(prefixMap)) {
      if ((location.certification || '').toLowerCase().includes(key) || 
          locationName.includes(key)) {
        prefix = value;
        break;
      }
    }
    
    // If no specific match was found, use a generic translation
    if (!chineseName) {
      const shortName = location.name
        .replace(/Dark Sky (Reserve|Sanctuary|Park|Community)/i, '')
        .replace(/International/i, '')
        .replace(/National Park/i, '国家公园')
        .replace(/State Park/i, '州立公园')
        .trim();
        
      chineseName = shortName + prefix;
    } else {
      chineseName += prefix;
    }
    
    return {
      ...location,
      chineseName
    };
  });
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

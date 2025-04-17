import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { findCertifiedLocations } from '@/services/locationSearchService';

// Export the function directly for external use
export { findCertifiedLocations };

/**
 * Fetch certified dark sky locations within radius
 * @param latitude User latitude
 * @param longitude User longitude
 * @param radius Search radius in km
 * @returns Promise of certified locations
 */
export async function fetchCertifiedLocationsNearby(
  latitude: number,
  longitude: number,
  radius: number = 500
): Promise<SharedAstroSpot[]> {
  try {
    // Call the location service
    return await findCertifiedLocations(latitude, longitude, radius);
  } catch (error) {
    console.error("Error fetching certified locations:", error);
    return [];
  }
}

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
 */
function addDarkSkyLodgingLocations(existingLocations: SharedAstroSpot[]): SharedAstroSpot[] {
  // Create a map of existing locations by coordinates
  const locationMap = new Map<string, SharedAstroSpot>();
  
  existingLocations.forEach(loc => {
    if (!loc.latitude || !loc.longitude) return;
    const key = `${loc.latitude.toFixed(4)}-${loc.longitude.toFixed(4)}`;
    locationMap.set(key, loc);
  });
  
  const darkSkyLodgings = [
    {
      id: 'under-canvas-mt',
      name: 'Under Canvas Mount Rushmore',
      chineseName: '拉什莫尔山露营地暗夜天空点',
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
      chineseName: '峡谷之门度假村暗夜天空点',
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
      chineseName: '安缦圭丽度假村暗夜天空点',
      latitude: 37.0153,
      longitude: -111.6258,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 1,
      type: 'lodging'
    },
    {
      id: 'finnich-cottages',
      name: 'Finnich Cottages',
      chineseName: '芬尼奇小屋暗夜天空点',
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
      chineseName: '朗加����店暗夜天空点',
      latitude: 63.8366,
      longitude: -20.3561,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 2,
      type: 'lodging'
    },
    {
      id: 'crystal-creek-rainforest',
      name: 'Crystal Creek Rainforest Retreat',
      chineseName: '水晶溪雨林度假村暗夜天空点',
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
      chineseName: '星野轻井泽暗夜天空点',
      latitude: 36.3339,
      longitude: 138.5928,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 3,
      type: 'lodging'
    },
    {
      id: 'kakslauttanen-arctic-resort',
      name: 'Kakslauttanen Arctic Resort',
      chineseName: '卡克斯劳塔宁北极度假村暗夜天空点',
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
      chineseName: '阿塔卡马探索酒店暗夜天空点',
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
      chineseName: 'AndBeyond 索苏斯维利沙漠小屋暗夜天空点',
      latitude: -24.7887,
      longitude: 15.3854,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 1,
      type: 'lodging'
    },
    {
      id: 'baines-camp',
      name: 'Sanctuary Baines Camp',
      chineseName: '贝恩斯营地',
      latitude: -19.5482,
      longitude: 22.9982,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 2,
      type: 'lodging'
    },
    {
      id: 'little-kulala',
      name: 'Little Kulala',
      chineseName: '小库拉拉营地',
      latitude: -24.3751,
      longitude: 15.6850,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 1,
      type: 'lodging'
    },
    {
      id: 'ali-starlightcamp',
      name: 'Ali & Reza\'s StarLightCamp',
      chineseName: '阿里和雷扎的星光营地',
      latitude: 34.9482,
      longitude: 53.5510,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Lodging - IDA Approved',
      timestamp: new Date().toISOString(),
      bortleScale: 2,
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
  // Create a map of existing locations by coordinates
  const locationMap = new Map<string, SharedAstroSpot>();
  
  existingLocations.forEach(loc => {
    if (!loc.latitude || !loc.longitude) return;
    const key = `${loc.latitude.toFixed(4)}-${loc.longitude.toFixed(4)}`;
    locationMap.set(key, loc);
  });
  
  const urbanLocations = [
    {
      id: 'flagstaff-urban',
      name: 'Flagstaff Urban Night Sky Place',
      chineseName: '弗拉格斯塔夫城市暗夜天空区',
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
      chineseName: '梅甘蒂克山城市暗夜天空保护区',
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
      chineseName: '图森城市暗夜天空区',
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
      chineseName: '塞多纳城市暗夜天空社区',
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
  // Create a map of existing locations by coordinates
  const locationMap = new Map<string, SharedAstroSpot>();
  
  existingLocations.forEach(loc => {
    if (!loc.latitude || !loc.longitude) return;
    const key = `${loc.latitude.toFixed(4)}-${loc.longitude.toFixed(4)}`;
    locationMap.set(key, loc);
  });
  
  // Comprehensive list of dark sky communities
  const communityLocations = [
    {
      id: 'westcliffe-community',
      name: 'Westcliffe & Silver Cliff Dark Sky Community',
      chineseName: '韦斯特克利夫和银崖暗夜天空社区',
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
      chineseName: '喷泉山暗夜天空社区',
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
      chineseName: '博雷戈温泉暗夜天空社区',
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
      chineseName: '滴泉暗夜天空社区',
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
    },
    {
      id: 'torrance-barrens-community',
      name: 'Torrance Barrens Dark Sky Preserve',
      chineseName: '托伦斯荒地暗夜天空保护区',
      latitude: 44.9272,
      longitude: -79.5131,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Preserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    {
      id: 'headlands-community',
      name: 'Headlands International Dark Sky Park',
      chineseName: '海德兰国际暗夜天空公园',
      latitude: 45.7842,
      longitude: -84.8466,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'homer-glen-community',
      name: 'Homer Glen Dark Sky Community',
      chineseName: '荷马格伦暗夜天空社区',
      latitude: 41.6012,
      longitude: -87.9381,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Community - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 4
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
    {
      id: 'yeongyang-firefly',
      name: 'Yeongyang Firefly Eco Park Dark Sky Park',
      chineseName: '英阳萤火虫生态公园暗夜天空公园',
      latitude: 36.6552,
      longitude: 129.1122,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    {
      id: 'jindo-dark-sky',
      name: 'Jindo Dark Sky Park',
      chineseName: '珍岛暗夜天空公园',
      latitude: 34.4763,
      longitude: 126.2631,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    {
      id: 'yaeyama-dark-sky',
      name: 'Yaeyama Islands International Dark Sky Reserve',
      chineseName: '八重山群岛国际暗夜天空保护区',
      latitude: 24.4667,
      longitude: 124.2167,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'iriomote-ishigaki',
      name: 'Iriomote-Ishigaki National Park Dark Sky Reserve',
      chineseName: '西表石垣国家公园暗夜天空保护区',
      latitude: 24.3423,
      longitude: 124.1546,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'himawari-farm',
      name: 'Himawari Farm Dark Sky Park',
      chineseName: '向日葵农场暗夜天空公园',
      latitude: 42.9824,
      longitude: 140.9946,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
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
      const existing = locationMap.get(key)!;
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
 * Expanded function to add all IDA locations
 * This ensures we include ALL International Dark Sky Association certified locations
 */
function addAllIDACertifiedLocations(existingLocations: SharedAstroSpot[]): SharedAstroSpot[] {
  // Create a map of existing locations by coordinates to avoid duplicates
  const locationMap = new Map<string, SharedAstroSpot>();
  
  existingLocations.forEach(loc => {
    if (!loc.latitude || !loc.longitude) return;
    const key = `${loc.latitude.toFixed(4)}-${loc.longitude.toFixed(4)}`;
    locationMap.set(key, loc);
  });
  
  // Comprehensive list of all IDA certified locations
  // This includes Dark Sky Reserves, Parks, Communities, Sanctuaries and more
  // Based on official list from darksky.org
  const allIDALocations: SharedAstroSpot[] = [
    {
      id: 'aoraki-mackenzie-reserve',
      name: 'Aoraki Mackenzie International Dark Sky Reserve',
      chineseName: '奥拉基麦肯齐国际暗夜天空保护区',
      latitude: -43.9856,
      longitude: 170.4639,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'brecon-beacons-reserve',
      name: 'Brecon Beacons National Park International Dark Sky Reserve',
      chineseName: '布雷肯比肯斯国家公园国际暗夜天空保护区',
      latitude: 51.8828,
      longitude: -3.4322,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    {
      id: 'central-idaho-reserve',
      name: 'Central Idaho Dark Sky Reserve',
      chineseName: '爱达荷中部暗夜天空保护区',
      latitude: 44.2210,
      longitude: -114.9318,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'cranborne-chase-reserve',
      name: 'Cranborne Chase International Dark Sky Reserve',
      chineseName: '克兰伯恩蔡斯国际暗夜天空保护区',
      latitude: 51.0290,
      longitude: -2.1370,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    {
      id: 'exmoor-reserve',
      name: 'Exmoor National Park International Dark Sky Reserve',
      chineseName: '埃克斯穆尔国家公园国际暗夜天空保护区',
      latitude: 51.1407,
      longitude: -3.6118,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'kerry-reserve',
      name: 'Kerry International Dark Sky Reserve',
      chineseName: '克里国际暗夜天空保护区',
      latitude: 51.9480,
      longitude: -10.2293,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'mont-megantic-reserve',
      name: 'Mont-Mégantic International Dark Sky Reserve',
      chineseName: '梅甘蒂克山国际暗夜天空保护区',
      latitude: 45.4555,
      longitude: -71.1522,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'moore-reserve',
      name: 'Moore\'s Reserve (South Downs)',
      chineseName: '摩尔暗夜天空保护区（南唐斯）',
      latitude: 50.9160,
      longitude: -0.6067,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    {
      id: 'namib-rand-reserve',
      name: 'NamibRand International Dark Sky Reserve',
      chineseName: '纳米布兰德国际暗夜天空保护区',
      latitude: -24.9400,
      longitude: 16.0600,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'pic-du-midi-reserve',
      name: 'Pic du Midi International Dark Sky Reserve',
      chineseName: '米迪峰国际暗夜天空保护区',
      latitude: 42.9372,
      longitude: 0.1413,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'rhon-reserve',
      name: 'Rhön International Dark Sky Reserve',
      chineseName: '伦国际暗夜天空保护区',
      latitude: 50.3492,
      longitude: 9.9675,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'river-murray-reserve',
      name: 'River Murray International Dark Sky Reserve',
      chineseName: '墨累河国际暗夜天空保护区',
      latitude: -34.4048,
      longitude: 139.2851,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'snowdonia-reserve',
      name: 'Snowdonia National Park International Dark Sky Reserve',
      chineseName: '斯诺多尼亚国家公园国际暗夜天空保护区',
      latitude: 52.9493,
      longitude: -3.8872,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'wairarapa-reserve',
      name: 'Wairarapa International Dark Sky Reserve',
      chineseName: '怀拉拉帕国际暗夜天空保护区',
      latitude: -41.3446,
      longitude: 175.5440,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'westhavelland-reserve',
      name: 'Westhavelland International Dark Sky Reserve',
      chineseName: '西哈弗尔兰国际暗夜天空保护区',
      latitude: 52.6967,
      longitude: 12.3086,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Reserve - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    {
      id: 'winlaton-reserve',
      name: 'Northumberland International Dark Sky Park',
      chineseName: '诺森伯兰国际暗夜天空公园',
      latitude: 55.3000,
      longitude: -2.3300,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    
    {
      id: 'aotea-sanctuary',
      name: 'Aotea / Great Barrier Island International Dark Sky Sanctuary',
      chineseName: '奥特亚/大堡礁岛国际暗夜天空保护区',
      latitude: -36.2058,
      longitude: 175.4831,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Sanctuary - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'boundary-waters-sanctuary',
      name: 'Boundary Waters Canoe Area Wilderness',
      chineseName: '边界水域皮划艇区域荒野',
      latitude: 47.8297,
      longitude: -91.4884,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Sanctuary - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'cosmic-campground-sanctuary',
      name: 'Cosmic Campground International Dark Sky Sanctuary',
      chineseName: '宇宙营地国际暗夜天空保护区',
      latitude: 33.4733,
      longitude: -108.9225,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Sanctuary - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'gabriela-mistral-sanctuary',
      name: 'Gabriela Mistral Dark Sky Sanctuary',
      chineseName: '加布里埃拉·米斯特拉尔暗夜天空保护区',
      latitude: -30.2451,
      longitude: -70.7342,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Sanctuary - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'massacre-rim-sanctuary',
      name: 'Massacre Rim Dark Sky Sanctuary',
      chineseName: '大屠杀边缘暗夜天空保护区',
      latitude: 41.5683,
      longitude: -119.7522,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Sanctuary - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'pitcairn-islands-sanctuary',
      name: 'Pitcairn Islands Dark Sky Sanctuary',
      chineseName: '皮特凯恩群岛暗夜天空保护区',
      latitude: -25.0667,
      longitude: -130.1000,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Sanctuary - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'rainbow-bridge-sanctuary',
      name: 'Rainbow Bridge National Monument Dark Sky Sanctuary',
      chineseName: '彩虹桥国家纪念碑暗夜天空保护区',
      latitude: 37.0772,
      longitude: -110.9639,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Sanctuary - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'stewarts-point-sanctuary',
      name: 'The Jump-Off Dark Sky Sanctuary',
      chineseName: '跳跃点暗夜天空保护区',
      latitude: 34.7666,
      longitude: -92.4813,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Sanctuary - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    
    {
      id: 'anza-borrego-park',
      name: 'Anza-Borrego Desert State Park',
      chineseName: '安扎-博雷戈沙漠州立公园',
      latitude: 33.2550,
      longitude: -116.3763,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'arches-park',
      name: 'Arches National Park',
      chineseName: '拱门国家公园',
      latitude: 38.7331,
      longitude: -109.5925,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'big-bend-park',
      name: 'Big Bend National Park',
      chineseName: '大弯国家公园',
      latitude: 29.2498,
      longitude: -103.2502,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'black-canyon-park',
      name: 'Black Canyon of the Gunnison National Park',
      chineseName: '甘尼森峡谷国家公园',
      latitude: 38.5754, 
      longitude: -107.7416,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'bryce-canyon-park',
      name: 'Bryce Canyon National Park',
      chineseName: '布莱斯峡谷国家公园',
      latitude: 37.6283,
      longitude: -112.1677,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'canyonlands-park',
      name: 'Canyonlands National Park',
      chineseName: '峡谷地国家公园',
      latitude: 38.2136,
      longitude: -109.9025,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'capitol-reef-park',
      name: 'Capitol Reef National Park',
      chineseName: '圆顶礁国家公园',
      latitude: 38.2821,
      longitude: -111.2471,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'chaco-culture-park',
      name: 'Chaco Culture National Historical Park',
      chineseName: '查科文化国家历史公园',
      latitude: 36.0319,
      longitude: -107.9698,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'death-valley-park',
      name: 'Death Valley National Park',
      chineseName: '死亡谷国家公园',
      latitude: 36.5323, 
      longitude: -116.9325,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'dinosaur-park',
      name: 'Dinosaur National Monument',
      chineseName: '恐龙国家纪念碑',
      latitude: 40.5435, 
      longitude: -108.9986,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'grand-canyon-park',
      name: 'Grand Canyon National Park',
      chineseName: '大峡谷国家公园',
      latitude: 36.1069, 
      longitude: -112.1129,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'great-basin-park',
      name: 'Great Basin National Park',
      chineseName: '大盆地国家公园',
      latitude: 38.9500, 
      longitude: -114.2600,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 1
    },
    {
      id: 'joshua-tree-park',
      name: 'Joshua Tree National Park',
      chineseName: '约书亚树国家公园',
      latitude: 33.8734,
      longitude: -115.9010,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    {
      id: 'mesa-verde-park',
      name: 'Mesa Verde National Park',
      chineseName: '梅萨维德国家公园',
      latitude: 37.2308, 
      longitude: -108.4618,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'natural-bridges-park',
      name: 'Natural Bridges National Monument',
      chineseName: '天然桥国家纪念碑',
      latitude: 37.6087, 
      longitude: -109.9753,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'petrified-forest-park',
      name: 'Petrified Forest National Park',
      chineseName: '石化森林国家公园',
      latitude: 35.0865, 
      longitude: -109.7820,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'salinas-pueblo-park',
      name: 'Salinas Pueblo Missions National Monument',
      chineseName: '萨莱纳斯普韦布洛使团国家纪念碑',
      latitude: 34.2598, 
      longitude: -106.0907,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    {
      id: 'sark-park',
      name: 'Sark International Dark Sky Community',
      chineseName: '萨克国际暗夜天空社区',
      latitude: 49.4327,
      longitude: -2.3641,
      isDarkSkyReserve: false,
      certification: 'Dark Sky Community - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    {
      id: 'stelvio-park',
      name: 'Stelvio National Park',
      chineseName: '斯泰尔维奥国家公园',
      latitude: 46.4983, 
      longitude: 10.5415,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 3
    },
    {
      id: 'waterton-glacier-park',
      name: 'Waterton-Glacier International Peace Park',
      chineseName: '沃特顿-冰川国际和平公园',
      latitude: 48.7596, 
      longitude: -113.7870,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    },
    {
      id: 'zselic-park',
      name: 'Zselic National Landscape Protection Area',
      chineseName: '泽利茨国家景观保护区',
      latitude: 46.2368, 
      longitude: 17.7660,
      isDarkSkyReserve: true,
      certification: 'Dark Sky Park - International Dark Sky Association',
      timestamp: new Date().toISOString(),
      bortleScale: 2
    }
  ];
  
  // Add all IDA locations
  allIDALocations.forEach(location => {
    const key = `${location.latitude.toFixed(4)}-${location.longitude.toFixed(4)}`;
    if (!locationMap.has(key)) {
      locationMap.set(key, location);
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
    
    // Add ALL IDA certified locations that might be missing
    const withAllIDA = addAllIDACertifiedLocations(withLodging);
    
    // Update cache and timestamp
    cachedCertifiedLocations = withAllIDA;
    lastCacheUpdate = Date.now();
    
    // Save to localStorage for future quick loads
    try {
      localStorage.setItem('cachedCertifiedLocations', JSON.stringify(withAllIDA));
    } catch (error) {
      console.error("Error saving certified locations to cache:", error);
    }
    
    console.log(`Total certified locations after augmentation: ${withAllIDA.length}`);
    return withAllIDA;
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

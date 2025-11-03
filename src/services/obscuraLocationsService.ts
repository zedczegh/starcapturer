import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Cache for obscura locations
let cachedObscuraLocations: SharedAstroSpot[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Atlas Obscura locations with coordinates
 * Data sourced from https://www.atlasobscura.com/places
 */
const atlasObscuraLocations: SharedAstroSpot[] = [
  {
    id: 'castle-baroness-scoppa',
    name: 'Castle of Baroness Scoppa',
    chineseName: '斯科帕女男爵城堡',
    latitude: 38.6009,
    longitude: 16.4028,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 5,
    siqs: 6.5
  },
  {
    id: 'butterflies-maj',
    name: 'Butterflies on Máj',
    chineseName: '马耶的蝴蝶',
    latitude: 50.0822,
    longitude: 14.4199,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 6,
    siqs: 5.2
  },
  {
    id: 'suicide-cemetery',
    name: 'The Suicide Cemetery',
    chineseName: '自杀者墓地',
    latitude: 52.4967,
    longitude: 13.2032,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 6,
    siqs: 5.0
  },
  {
    id: 'church-our-lady',
    name: 'Church of Our Lady',
    chineseName: '圣母教堂',
    latitude: 55.6804,
    longitude: 11.0808,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 5,
    siqs: 6.8
  },
  {
    id: 'fu-lu-shou-complex',
    name: 'Fu Lu Shou Complex',
    chineseName: '福禄寿综合体',
    latitude: 1.3017,
    longitude: 103.8546,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 7,
    siqs: 4.5
  },
  {
    id: 'trojan-horse',
    name: 'Çanakkale Trojan Horse',
    chineseName: '恰纳卡莱特洛伊木马',
    latitude: 40.1519,
    longitude: 26.4051,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 5,
    siqs: 6.0
  },
  {
    id: 'wied-il-ghasri',
    name: 'Wied il-Għasri',
    chineseName: '维埃德伊尔加斯里',
    latitude: 36.0787,
    longitude: 14.2284,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 4,
    siqs: 7.5
  },
  {
    id: 'marjuns-lifting-stone',
    name: "Marjun's Lifting Stone",
    chineseName: '马容举石',
    latitude: 62.3352,
    longitude: -6.7654,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 4,
    siqs: 8.0
  },
  {
    id: 'mingo-gc30',
    name: 'Mingo GC30',
    chineseName: '明戈GC30',
    latitude: 39.2780,
    longitude: -100.9437,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.5
  },
  {
    id: 'pere-cheney-cemetery',
    name: 'Pere Cheney Cemetery',
    chineseName: '佩雷切尼墓地',
    latitude: 44.5434,
    longitude: -84.7221,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 4,
    siqs: 7.8
  },
  {
    id: 'tianzi-hotel',
    name: 'Tianzi Hotel',
    chineseName: '天子大酒店',
    latitude: 30.7642,
    longitude: 114.9431,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 7,
    siqs: 4.2
  },
  {
    id: 'forbidden-city',
    name: 'The Forbidden City',
    chineseName: '故宫',
    latitude: 39.9163,
    longitude: 116.3972,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 8,
    siqs: 3.5
  },
  {
    id: 'jiuzhaigou-valley',
    name: 'Jiuzhaigou Valley',
    chineseName: '九寨沟',
    latitude: 33.2600,
    longitude: 103.9200,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.8
  },
  {
    id: 'park-street-station',
    name: 'Park Street Station Mural',
    chineseName: '公园街站壁画',
    latitude: 42.3564,
    longitude: -71.0625,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 8,
    siqs: 3.0
  },
  {
    id: 'willie-whale',
    name: 'Willie the Whale',
    chineseName: '鲸鱼威利',
    latitude: 40.4850,
    longitude: -86.1390,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 6,
    siqs: 5.5
  },
  {
    id: 'hope-mill',
    name: 'Hope Mill Conservation Area',
    chineseName: '希望磨坊保护区',
    latitude: 44.2841,
    longitude: -78.1740,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 4,
    siqs: 7.2
  },
  {
    id: 'project-chimps',
    name: 'Project Chimps',
    chineseName: '黑猩猩保护项目',
    latitude: 34.9232,
    longitude: -84.2285,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 4,
    siqs: 7.6
  },
  {
    id: 'withy-grove-stores',
    name: 'Withy Grove Stores',
    chineseName: '威西格罗夫商店',
    latitude: 53.4847,
    longitude: -2.2404,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 7,
    siqs: 4.8
  },
  {
    id: 'turtle-cannery-museum',
    name: 'Turtle Cannery Museum',
    chineseName: '海龟罐头博物馆',
    latitude: 24.5619,
    longitude: -81.8008,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 6,
    siqs: 5.8
  },
  {
    id: 'seaboard-railroad-turntable',
    name: 'Seaboard Air Line Railroad Turntable',
    chineseName: '海滨航空铁路转台',
    latitude: 35.7874,
    longitude: -78.6418,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 7,
    siqs: 4.5
  },
  {
    id: 'carhenge',
    name: 'Carhenge',
    chineseName: '汽车巨石阵',
    latitude: 42.6042,
    longitude: -103.7469,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.2
  },
  {
    id: 'the-wave',
    name: 'The Wave',
    chineseName: '波浪岩',
    latitude: 36.9959,
    longitude: -112.0062,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.8
  },
  {
    id: 'antelope-canyon',
    name: 'Antelope Canyon',
    chineseName: '羚羊峡谷',
    latitude: 36.8619,
    longitude: -111.3743,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.5
  },
  {
    id: 'door-to-hell',
    name: 'Door to Hell',
    chineseName: '地狱之门',
    latitude: 40.2530,
    longitude: 58.4397,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.7
  },
  {
    id: 'fingals-cave',
    name: "Fingal's Cave",
    chineseName: '芬格尔洞穴',
    latitude: 56.4326,
    longitude: -6.3369,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.0
  },
  {
    id: 'mount-roraima',
    name: 'Mount Roraima',
    chineseName: '罗赖马山',
    latitude: 5.1433,
    longitude: -60.7625,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'salar-de-uyuni',
    name: 'Salar de Uyuni',
    chineseName: '乌尤尼盐沼',
    latitude: -20.3078,
    longitude: -66.8250,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.8
  },
  {
    id: 'stone-forest',
    name: 'Stone Forest',
    chineseName: '石林',
    latitude: 24.8142,
    longitude: 103.2717,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 5,
    siqs: 7.0
  },
  {
    id: 'glowworm-caves',
    name: 'Glowworm Caves',
    chineseName: '萤火虫洞',
    latitude: -38.2611,
    longitude: 175.1031,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.6
  },
  {
    id: 'giants-causeway',
    name: "Giant's Causeway",
    chineseName: '巨人堤道',
    latitude: 55.2408,
    longitude: -6.5116,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.7
  }
];

/**
 * Get all Atlas Obscura locations sorted by SIQS score
 */
export async function getAllObscuraLocations(): Promise<SharedAstroSpot[]> {
  // Check cache
  if (cachedObscuraLocations && (Date.now() - lastCacheUpdate < CACHE_TTL)) {
    return cachedObscuraLocations;
  }

  // Sort by SIQS score (highest first)
  const sortedLocations = [...atlasObscuraLocations].sort((a, b) => {
    const siqsA = typeof a.siqs === 'number' ? a.siqs : (a.siqs?.score || 0);
    const siqsB = typeof b.siqs === 'number' ? b.siqs : (b.siqs?.score || 0);
    return siqsB - siqsA;
  });

  // Update cache
  cachedObscuraLocations = sortedLocations;
  lastCacheUpdate = Date.now();

  // Save to localStorage
  try {
    localStorage.setItem('cachedObscuraLocations', JSON.stringify(sortedLocations));
  } catch (error) {
    console.error("Error caching obscura locations:", error);
  }

  console.log(`Loaded ${sortedLocations.length} Atlas Obscura locations`);
  return sortedLocations;
}

/**
 * Preload obscura locations from cache or fetch fresh
 */
export async function preloadObscuraLocations(): Promise<SharedAstroSpot[]> {
  // Try localStorage first
  const storedLocations = localStorage.getItem('cachedObscuraLocations');
  if (storedLocations) {
    try {
      const parsed = JSON.parse(storedLocations);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedObscuraLocations = parsed;
        console.log(`Using ${parsed.length} cached obscura locations`);
        return parsed;
      }
    } catch (error) {
      console.error("Error parsing cached obscura locations:", error);
    }
  }

  return getAllObscuraLocations();
}

/**
 * Force refresh obscura locations
 */
export async function forceObscuraLocationsRefresh(): Promise<SharedAstroSpot[]> {
  cachedObscuraLocations = null;
  lastCacheUpdate = 0;
  
  try {
    localStorage.removeItem('cachedObscuraLocations');
  } catch (error) {
    console.error("Error clearing cached obscura locations:", error);
  }
  
  return getAllObscuraLocations();
}

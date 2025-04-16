
import { LocationEntry } from "../locationDatabase";

/**
 * Official Dark Sky locations with accurate Bortle scale values
 * Enhanced with Chinese translations
 */
export const darkSkyLocations: (LocationEntry & { chineseName?: string })[] = [
  // Dark Sky Reserves
  { 
    name: "NamibRand Dark Sky Reserve", 
    chineseName: "纳米布兰德暗夜天空保护区",
    coordinates: [-24.9400, 16.0600], 
    bortleScale: 1.0, 
    radius: 50, 
    type: 'dark-site' 
  },
  { 
    name: "Aoraki Mackenzie Dark Sky Reserve", 
    chineseName: "奥拉基麦肯齐暗夜天空保护区",
    coordinates: [-43.9856, 170.4639], 
    bortleScale: 1.0, 
    radius: 45, 
    type: 'dark-site' 
  },
  { 
    name: "Alpes Azur Mercantour Dark Sky Reserve", 
    chineseName: "阿尔卑斯蓝天默尔康图暗夜天空保护区",
    coordinates: [44.1800, 7.0500], 
    bortleScale: 2.0, 
    radius: 40, 
    type: 'dark-site' 
  },
  { 
    name: "Central Idaho Dark Sky Reserve", 
    chineseName: "爱达荷中部暗夜天空保护区",
    coordinates: [44.2210, -114.9318], 
    bortleScale: 1.5, 
    radius: 45, 
    type: 'dark-site' 
  },
  
  // Dark Sky Sanctuaries
  { 
    name: "Gabriela Mistral Dark Sky Sanctuary", 
    chineseName: "加布里埃拉·米斯特拉尔暗夜天空保护区",
    coordinates: [-30.2451, -70.7342], 
    bortleScale: 1.0, 
    radius: 40, 
    type: 'dark-site' 
  },
  { 
    name: "Great Barrier Island Dark Sky Sanctuary", 
    chineseName: "大障碍岛暗夜天空保护区",
    coordinates: [-36.2058, 175.4831], 
    bortleScale: 1.0, 
    radius: 35, 
    type: 'dark-site' 
  },
  
  // Asian Dark Sky Places
  { 
    name: "Yaeyama Islands Dark Sky Reserve", 
    chineseName: "八重山群岛暗夜天空保护区",
    coordinates: [24.4667, 124.2167], 
    bortleScale: 2.0, 
    radius: 30, 
    type: 'dark-site' 
  },
  { 
    name: "Iriomote-Ishigaki National Park Dark Sky Reserve", 
    chineseName: "西表石垣国家公园暗夜天空保护区",
    coordinates: [24.3423, 124.1546], 
    bortleScale: 1.5, 
    radius: 35, 
    type: 'dark-site' 
  },
  { 
    name: "Yeongyang International Dark Sky Park", 
    chineseName: "英阳国际暗夜天空公园",
    coordinates: [36.6552, 129.1122], 
    bortleScale: 2.0, 
    radius: 25, 
    type: 'dark-site' 
  }
];


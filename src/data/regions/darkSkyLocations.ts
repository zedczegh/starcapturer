
import { LocationEntry } from "../locationDatabase";

/**
 * Official Dark Sky locations with accurate Bortle scale values
 * Enhanced with Chinese translations and detailed climate data
 */
export const darkSkyLocations: (LocationEntry & { 
  chineseName?: string;
  clearSkyRate?: number;
  clearestMonths?: string[];
  annualPrecipitationDays?: number;
  seasonalTrends?: Record<string, any>;
  visibility?: string;
})[] = [
  // Dark Sky Reserves
  { 
    name: "NamibRand Dark Sky Reserve", 
    chineseName: "纳米布兰德暗夜天空保护区",
    coordinates: [-24.9400, 16.0600], 
    bortleScale: 1.0, 
    radius: 50, 
    type: 'dark-site',
    clearSkyRate: 89,
    clearestMonths: ['May', 'Jun', 'Jul', 'Aug'],
    annualPrecipitationDays: 25,
    visibility: 'excellent',
    seasonalTrends: {
      spring: { clearSkyRate: 85, averageTemperature: 22 },
      summer: { clearSkyRate: 65, averageTemperature: 32 },
      fall: { clearSkyRate: 90, averageTemperature: 25 },
      winter: { clearSkyRate: 95, averageTemperature: 18 }
    }
  },
  { 
    name: "Aoraki Mackenzie Dark Sky Reserve", 
    chineseName: "奥拉基麦肯齐暗夜天空保护区",
    coordinates: [-43.9856, 170.4639], 
    bortleScale: 1.0, 
    radius: 45, 
    type: 'dark-site',
    clearSkyRate: 75,
    clearestMonths: ['Feb', 'Mar', 'Apr'],
    annualPrecipitationDays: 120,
    visibility: 'excellent',
    seasonalTrends: {
      spring: { clearSkyRate: 68, averageTemperature: 10 },
      summer: { clearSkyRate: 75, averageTemperature: 18 },
      fall: { clearSkyRate: 70, averageTemperature: 12 },
      winter: { clearSkyRate: 65, averageTemperature: 3 }
    }
  },
  { 
    name: "Alpes Azur Mercantour Dark Sky Reserve", 
    chineseName: "阿尔卑斯蓝天默尔康图暗夜天空保护区",
    coordinates: [44.1800, 7.0500], 
    bortleScale: 2.0, 
    radius: 40, 
    type: 'dark-site',
    clearSkyRate: 72,
    clearestMonths: ['Jul', 'Aug', 'Sep'],
    annualPrecipitationDays: 80,
    visibility: 'excellent',
    seasonalTrends: {
      spring: { clearSkyRate: 65, averageTemperature: 12 },
      summer: { clearSkyRate: 80, averageTemperature: 22 },
      fall: { clearSkyRate: 70, averageTemperature: 15 },
      winter: { clearSkyRate: 55, averageTemperature: 0 }
    }
  },
  { 
    name: "Central Idaho Dark Sky Reserve", 
    chineseName: "爱达荷中部暗夜天空保护区",
    coordinates: [44.2210, -114.9318], 
    bortleScale: 1.5, 
    radius: 45, 
    type: 'dark-site',
    clearSkyRate: 80,
    clearestMonths: ['Jul', 'Aug', 'Sep'],
    annualPrecipitationDays: 70,
    visibility: 'excellent',
    seasonalTrends: {
      spring: { clearSkyRate: 65, averageTemperature: 10 },
      summer: { clearSkyRate: 85, averageTemperature: 25 },
      fall: { clearSkyRate: 75, averageTemperature: 15 },
      winter: { clearSkyRate: 60, averageTemperature: -5 }
    }
  },
  
  // Dark Sky Sanctuaries
  { 
    name: "Gabriela Mistral Dark Sky Sanctuary", 
    chineseName: "加布里埃拉·米斯特拉尔暗夜天空保护区",
    coordinates: [-30.2451, -70.7342], 
    bortleScale: 1.0, 
    radius: 40, 
    type: 'dark-site',
    clearSkyRate: 87,
    clearestMonths: ['May', 'Jun', 'Jul', 'Aug'],
    annualPrecipitationDays: 15,
    visibility: 'excellent',
    seasonalTrends: {
      spring: { clearSkyRate: 80, averageTemperature: 18 },
      summer: { clearSkyRate: 70, averageTemperature: 25 },
      fall: { clearSkyRate: 90, averageTemperature: 18 },
      winter: { clearSkyRate: 95, averageTemperature: 10 }
    }
  },
  { 
    name: "Great Barrier Island Dark Sky Sanctuary", 
    chineseName: "大障碍岛暗夜天空保护区",
    coordinates: [-36.2058, 175.4831], 
    bortleScale: 1.0, 
    radius: 35, 
    type: 'dark-site',
    clearSkyRate: 68,
    clearestMonths: ['Jan', 'Feb', 'Mar'],
    annualPrecipitationDays: 150,
    visibility: 'excellent',
    seasonalTrends: {
      spring: { clearSkyRate: 65, averageTemperature: 15 },
      summer: { clearSkyRate: 75, averageTemperature: 22 },
      fall: { clearSkyRate: 70, averageTemperature: 17 },
      winter: { clearSkyRate: 60, averageTemperature: 12 }
    }
  },
  
  // Asian Dark Sky Places
  { 
    name: "Yaeyama Islands Dark Sky Reserve", 
    chineseName: "八重山群岛暗夜天空保护区",
    coordinates: [24.4667, 124.2167], 
    bortleScale: 2.0, 
    radius: 30, 
    type: 'dark-site',
    clearSkyRate: 65,
    clearestMonths: ['Oct', 'Nov', 'Dec', 'Jan'],
    annualPrecipitationDays: 140,
    visibility: 'good',
    seasonalTrends: {
      spring: { clearSkyRate: 50, averageTemperature: 22 },
      summer: { clearSkyRate: 45, averageTemperature: 29 },
      fall: { clearSkyRate: 75, averageTemperature: 24 },
      winter: { clearSkyRate: 80, averageTemperature: 18 }
    }
  },
  { 
    name: "Iriomote-Ishigaki National Park Dark Sky Reserve", 
    chineseName: "西表石垣国家公园暗夜天空保护区",
    coordinates: [24.3423, 124.1546], 
    bortleScale: 1.5, 
    radius: 35, 
    type: 'dark-site',
    clearSkyRate: 68,
    clearestMonths: ['Nov', 'Dec', 'Jan', 'Feb'],
    annualPrecipitationDays: 130,
    visibility: 'excellent',
    seasonalTrends: {
      spring: { clearSkyRate: 55, averageTemperature: 23 },
      summer: { clearSkyRate: 48, averageTemperature: 30 },
      fall: { clearSkyRate: 78, averageTemperature: 25 },
      winter: { clearSkyRate: 82, averageTemperature: 19 }
    }
  },
  { 
    name: "Yeongyang International Dark Sky Park", 
    chineseName: "英阳国际暗夜天空公园",
    coordinates: [36.6552, 129.1122], 
    bortleScale: 2.0, 
    radius: 25, 
    type: 'dark-site',
    clearSkyRate: 62,
    clearestMonths: ['Oct', 'Nov', 'Dec'],
    annualPrecipitationDays: 110,
    visibility: 'good',
    seasonalTrends: {
      spring: { clearSkyRate: 58, averageTemperature: 15 },
      summer: { clearSkyRate: 45, averageTemperature: 28 },
      fall: { clearSkyRate: 70, averageTemperature: 18 },
      winter: { clearSkyRate: 65, averageTemperature: 0 }
    }
  },
  { 
    name: "Shenzhen Xichong Dark Sky Community", 
    chineseName: "深圳西涌暗夜社区",
    coordinates: [22.5808, 114.5034], 
    bortleScale: 5, 
    radius: 10, 
    type: 'urban',
    clearSkyRate: 48,
    clearestMonths: ['Oct', 'Nov', 'Dec', 'Jan'],
    annualPrecipitationDays: 150,
    visibility: 'average',
    seasonalTrends: {
      spring: { clearSkyRate: 45, averageTemperature: 22 },
      summer: { clearSkyRate: 35, averageTemperature: 32 },
      fall: { clearSkyRate: 60, averageTemperature: 24 },
      winter: { clearSkyRate: 65, averageTemperature: 16 }
    }
  },
  // Adding new certified locations
  {
    name: "Hehuan Mountain Dark Sky Park",
    chineseName: "合欢山暗夜天空公园",
    coordinates: [24.1384, 121.2822],
    bortleScale: 2.0,
    radius: 30,
    type: 'dark-site',
    clearSkyRate: 70,
    clearestMonths: ['Nov', 'Dec', 'Jan', 'Feb'],
    annualPrecipitationDays: 95,
    visibility: 'excellent',
    seasonalTrends: {
      spring: { clearSkyRate: 65, averageTemperature: 12 },
      summer: { clearSkyRate: 55, averageTemperature: 22 },
      fall: { clearSkyRate: 75, averageTemperature: 15 },
      winter: { clearSkyRate: 80, averageTemperature: 5 }
    }
  },
  {
    name: "Boundary Waters Canoe Area",
    chineseName: "边界水域独木舟区",
    coordinates: [47.9504, -91.4153],
    bortleScale: 1.0,
    radius: 45,
    type: 'dark-site',
    clearSkyRate: 72,
    clearestMonths: ['Aug', 'Sep', 'Oct'],
    annualPrecipitationDays: 130,
    visibility: 'excellent',
    seasonalTrends: {
      spring: { clearSkyRate: 58, averageTemperature: 5 },
      summer: { clearSkyRate: 75, averageTemperature: 20 },
      fall: { clearSkyRate: 80, averageTemperature: 10 },
      winter: { clearSkyRate: 65, averageTemperature: -15 }
    }
  },
  {
    name: "Cherry Springs State Park",
    chineseName: "樱桃泉州立公园",
    coordinates: [41.6614, -77.8227],
    bortleScale: 2.0,
    radius: 25,
    type: 'dark-site',
    clearSkyRate: 63,
    clearestMonths: ['Aug', 'Sep', 'Oct'],
    annualPrecipitationDays: 135,
    visibility: 'excellent',
    seasonalTrends: {
      spring: { clearSkyRate: 55, averageTemperature: 8 },
      summer: { clearSkyRate: 65, averageTemperature: 22 },
      fall: { clearSkyRate: 70, averageTemperature: 12 },
      winter: { clearSkyRate: 50, averageTemperature: -5 }
    }
  },
  {
    name: "Westhavelland International Dark Sky Reserve",
    chineseName: "韦斯特哈弗兰国际暗夜天空保护区",
    coordinates: [52.7358, 12.4514],
    bortleScale: 3.0,
    radius: 35,
    type: 'dark-site',
    clearSkyRate: 55,
    clearestMonths: ['Jul', 'Aug', 'Sep'],
    annualPrecipitationDays: 150,
    visibility: 'good',
    seasonalTrends: {
      spring: { clearSkyRate: 50, averageTemperature: 10 },
      summer: { clearSkyRate: 60, averageTemperature: 22 },
      fall: { clearSkyRate: 55, averageTemperature: 12 },
      winter: { clearSkyRate: 45, averageTemperature: 0 }
    }
  },
  {
    name: "Warrumbungle National Park",
    chineseName: "沃伦邦格尔国家公园",
    coordinates: [-31.2747, 149.0110],
    bortleScale: 1.5,
    radius: 30,
    type: 'dark-site',
    clearSkyRate: 78,
    clearestMonths: ['Apr', 'May', 'Jun', 'Jul'],
    annualPrecipitationDays: 75,
    visibility: 'excellent',
    seasonalTrends: {
      spring: { clearSkyRate: 72, averageTemperature: 18 },
      summer: { clearSkyRate: 65, averageTemperature: 30 },
      fall: { clearSkyRate: 80, averageTemperature: 20 },
      winter: { clearSkyRate: 85, averageTemperature: 12 }
    }
  }
];

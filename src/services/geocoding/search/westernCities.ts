
import { Location } from '../types';

/**
 * Get database of western cities for special case handling
 * Enhanced with certified Dark Sky locations
 */
export function getWesternCitiesDatabase(): Record<string, Location> {
  return {
    "california": {
      name: "California, USA",
      latitude: 36.7783,
      longitude: -119.4179,
      placeDetails: "State in United States"
    },
    "new york": {
      name: "New York City, USA",
      latitude: 40.7128,
      longitude: -74.0060,
      placeDetails: "City in United States"
    },
    "london": {
      name: "London, United Kingdom",
      latitude: 51.5074,
      longitude: -0.1278,
      placeDetails: "Capital city of United Kingdom"
    },
    "paris": {
      name: "Paris, France",
      latitude: 48.8566,
      longitude: 2.3522,
      placeDetails: "Capital city of France"
    },
    "tokyo": {
      name: "Tokyo, Japan",
      latitude: 35.6762,
      longitude: 139.6503,
      placeDetails: "Capital city of Japan"
    },
    // IDA Dark Sky Sanctuaries
    "stewart island": {
      name: "Stewart Island Dark Sky Sanctuary, New Zealand",
      chineseName: "斯图尔特岛暗夜保护区, 新西兰",
      latitude: -46.9973,
      longitude: 167.8376,
      placeDetails: "Dark Sky Sanctuary - International Dark Sky Association"
    },
    "gabriela mistral": {
      name: "Gabriela Mistral Dark Sky Sanctuary, Chile",
      chineseName: "加夫列拉·米斯特拉尔暗夜保护区, 智利",
      latitude: -30.2451,
      longitude: -70.7342,
      placeDetails: "Dark Sky Sanctuary - International Dark Sky Association"
    },
    // IDA Dark Sky Reserves
    "aoraki": {
      name: "Aoraki Mackenzie Dark Sky Reserve, New Zealand",
      chineseName: "奥拉基麦肯奇暗夜保护区, 新西兰",
      latitude: -43.9856,
      longitude: 170.4639,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "brecon beacons": {
      name: "Brecon Beacons Dark Sky Reserve, Wales",
      chineseName: "布雷肯比肯斯暗夜保护区, 威尔士",
      latitude: 51.9478,
      longitude: -3.4868,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "exmoor": {
      name: "Exmoor Dark Sky Reserve, England",
      chineseName: "埃克斯穆尔暗夜保护区, 英格兰",
      latitude: 51.1146,
      longitude: -3.6493,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "kerry": {
      name: "Kerry Dark Sky Reserve, Ireland",
      chineseName: "凯里暗夜保护区, 爱尔兰",
      latitude: 51.9457,
      longitude: -10.2273,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "mont megantic": {
      name: "Mont-Mégantic Dark Sky Reserve, Canada",
      chineseName: "梅甘蒂克山暗夜保护区, 加拿大",
      latitude: 45.4568,
      longitude: -71.1524,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "natural bridges": {
      name: "Natural Bridges National Monument Dark Sky Park, USA",
      chineseName: "自然桥国家纪念碑暗夜公园, 美国",
      latitude: 37.6124,
      longitude: -109.9847,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "cherry springs": {
      name: "Cherry Springs State Park Dark Sky Park, USA",
      chineseName: "樱泉州立公园暗夜公园, 美国",
      latitude: 41.6626,
      longitude: -77.8236,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "westhavelland": {
      name: "Westhavelland Dark Sky Reserve, Germany",
      chineseName: "西哈弗尔暗夜保护区, 德国",
      latitude: 52.6667,
      longitude: 12.4833,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    // Additional Dark Sky locations
    "alpes azur mercantour": {
      name: "Alpes Azur Mercantour Dark Sky Reserve, France",
      chineseName: "阿尔卑斯蔚蓝水星暗夜保护区, 法国", 
      latitude: 44.1800, 
      longitude: 7.0500,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "central idaho": {
      name: "Central Idaho Dark Sky Reserve, USA", 
      chineseName: "爱达荷州中部暗夜保护区, 美国",
      latitude: 44.2210, 
      longitude: -114.9318,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "namibrand": {
      name: "NamibRand Dark Sky Reserve, Namibia", 
      chineseName: "纳米布兰德暗夜保护区, 纳米比亚",
      latitude: -24.9400, 
      longitude: 16.0600,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "cranborne chase": {
      name: "Cranborne Chase Dark Sky Reserve, England", 
      chineseName: "克兰博恩蔡斯暗夜保护区, 英格兰",
      latitude: 51.0290, 
      longitude: -2.1370,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "snowdonia": {
      name: "Snowdonia Dark Sky Reserve, Wales", 
      chineseName: "雪墩山暗夜保护区, 威尔士",
      latitude: 52.9493, 
      longitude: -3.8872,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "rhön": {
      name: "Rhön Dark Sky Reserve, Germany", 
      chineseName: "伦山暗夜保护区, 德国",
      latitude: 50.3492, 
      longitude: 9.9675,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "galloway": {
      name: "Galloway Dark Sky Park, Scotland", 
      chineseName: "加洛韦暗夜公园, 苏格兰",
      latitude: 55.1054, 
      longitude: -4.4899,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "great barrier island": {
      name: "Great Barrier Island Dark Sky Sanctuary, New Zealand", 
      chineseName: "大屏障岛暗夜保护区, 新西兰",
      latitude: -36.2058, 
      longitude: 175.4831,
      placeDetails: "Dark Sky Sanctuary - International Dark Sky Association"
    },
    "wairarapa": {
      name: "Wairarapa Dark Sky Reserve, New Zealand", 
      chineseName: "怀拉拉帕暗夜保护区, 新西兰",
      latitude: -41.3446, 
      longitude: 175.5440,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "river murray": {
      name: "River Murray Dark Sky Reserve, Australia", 
      chineseName: "墨累河暗夜保护区, 澳大利亚",
      latitude: -34.4048, 
      longitude: 139.2851,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    // Newly added East Asian locations
    "yaeyama": {
      name: "Yaeyama Islands International Dark Sky Reserve, Japan",
      chineseName: "八重山群岛国际暗夜保护区, 日本",
      latitude: 24.4667,
      longitude: 124.2167,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "iriomote ishigaki": {
      name: "Iriomote-Ishigaki National Park International Dark Sky Reserve, Japan",
      chineseName: "西表石垣国家公园国际暗夜保护区, 日本",
      latitude: 24.3423,
      longitude: 124.1546,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "yeongyang": {
      name: "Yeongyang International Dark Sky Park, South Korea",
      chineseName: "英阳国际暗夜公园, 韩国",
      latitude: 36.6552,
      longitude: 129.1122,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "jindo": {
      name: "Jindo Dark Sky Park, South Korea",
      chineseName: "珍岛暗夜公园, 韩国",
      latitude: 34.4763,
      longitude: 126.2631,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "shenzhen": {
      name: "Shenzhen Xichong Dark Sky Community, China",
      chineseName: "深圳西冲暗夜社区, 中国",
      latitude: 22.5808,
      longitude: 114.5034, 
      placeDetails: "Dark Sky Community - International Dark Sky Association"
    }
  };
}

/**
 * Find western city by name
 */
export function findWesternCity(name: string): Location | null {
  const cities = getWesternCitiesDatabase();
  const nameLower = name.toLowerCase().trim();
  
  // Direct lookup
  if (cities[nameLower]) {
    return cities[nameLower];
  }
  
  // Partial match
  for (const [key, city] of Object.entries(cities)) {
    if (key.includes(nameLower) || nameLower.includes(key)) {
      return city;
    }
  }
  
  return null;
}

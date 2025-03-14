// Import required functions and constants from matchingUtils
import { containsChineseCharacters, findBestMatches } from './matchingUtils';
import { Location, Language } from './types';

// Chinese city names and their alternatives for better searching
export const chineseCityAlternatives: Record<string, {
  name: string;
  chinese: string;
  alternatives: string[];
  coordinates: [number, number];
  placeDetails?: string;
}> = {
  "beijing": {
    name: "Beijing, China",
    chinese: "北京",
    alternatives: ["bei jing", "peking", "北京市", "北京市区"],
    coordinates: [39.9042, 116.4074],
    placeDetails: "Capital city of China"
  },
  "shanghai": {
    name: "Shanghai, China",
    chinese: "上海",
    alternatives: ["shang hai", "上海市", "上海市区"],
    coordinates: [31.2304, 121.4737],
    placeDetails: "Major city in China"
  },
  "guangzhou": {
    name: "Guangzhou, China",
    chinese: "广州",
    alternatives: ["guang zhou", "canton", "广州市", "广州市区"],
    coordinates: [23.1291, 113.2644],
    placeDetails: "Capital of Guangdong Province"
  },
  "shenzhen": {
    name: "Shenzhen, China",
    chinese: "深圳",
    alternatives: ["shen zhen", "深圳市", "深圳市区"],
    coordinates: [22.5431, 114.0579],
    placeDetails: "Tech hub in Guangdong Province"
  },
  "chengdu": {
    name: "Chengdu, China",
    chinese: "成都",
    alternatives: ["cheng du", "成都市", "成都市区"],
    coordinates: [30.5728, 104.0668],
    placeDetails: "Capital of Sichuan Province"
  },
  "hangzhou": {
    name: "Hangzhou, China",
    chinese: "杭州",
    alternatives: ["hang zhou", "杭州市", "杭州市区"],
    coordinates: [30.2741, 120.1551],
    placeDetails: "Capital of Zhejiang Province"
  },
  "chongqing": {
    name: "Chongqing, China",
    chinese: "重庆",
    alternatives: ["chong qing", "重庆市", "重庆市区"],
    coordinates: [29.4316, 106.9123],
    placeDetails: "Municipality in Southwest China"
  },
  "xian": {
    name: "Xi'an, China",
    chinese: "西安",
    alternatives: ["xi an", "xi'an", "xian", "西安市", "西安市区"],
    coordinates: [34.3416, 108.9398],
    placeDetails: "Capital of Shaanxi Province"
  },
  "nanjing": {
    name: "Nanjing, China",
    chinese: "南京",
    alternatives: ["nan jing", "南京市", "南京市区"],
    coordinates: [32.0584, 118.7965],
    placeDetails: "Capital of Jiangsu Province"
  },
  "wuhan": {
    name: "Wuhan, China",
    chinese: "武汉",
    alternatives: ["wu han", "武汉市", "武汉市区"],
    coordinates: [30.5928, 114.3055],
    placeDetails: "Capital of Hubei Province"
  },
  "tianjin": {
    name: "Tianjin, China",
    chinese: "天津",
    alternatives: ["tian jin", "天津市", "天津市区"],
    coordinates: [39.3434, 117.3616],
    placeDetails: "Municipality in Northern China"
  },
  "duyun": {
    name: "Duyun, Guizhou, China",
    chinese: "都匀",
    alternatives: ["du yun", "都匀市", "都匀市区", "都匀贵州"],
    coordinates: [26.2592, 107.5113],
    placeDetails: "City in Guizhou Province"
  },
  "guiyang": {
    name: "Guiyang, China",
    chinese: "贵阳",
    alternatives: ["gui yang", "贵阳市", "贵阳市区"],
    coordinates: [26.6470, 106.6302],
    placeDetails: "Capital of Guizhou Province"
  },
  "kunming": {
    name: "Kunming, China",
    chinese: "昆明",
    alternatives: ["kun ming", "昆明市", "昆明市区"],
    coordinates: [24.8796, 102.8329],
    placeDetails: "Capital of Yunnan Province"
  },
  "lhasa": {
    name: "Lhasa, Tibet, China",
    chinese: "拉萨",
    alternatives: ["la sa", "拉萨市", "西藏拉萨"],
    coordinates: [29.6500, 91.1000],
    placeDetails: "Capital of Tibet Autonomous Region"
  }
};

/**
 * Find locations in our internal database that match the search query
 * @param query Search query
 * @param limit Maximum number of results to return
 * @param language Current app language
 * @returns Array of matching locations
 */
export function findMatchingLocations(query: string, limit: number = 5, language: string = 'en'): Location[] {
  const results: Location[] = [];
  const queryLower = query.toLowerCase().trim();
  const hasChineseChars = containsChineseCharacters(queryLower);
  
  // First check our city alternatives for Chinese cities
  for (const [key, city] of Object.entries(chineseCityAlternatives)) {
    let match = false;
    
    // Prioritize Chinese character matches for Chinese queries
    if (hasChineseChars && city.chinese.includes(queryLower)) {
      match = true;
    } 
    // For Duyun (都匀) special case, check for exact match
    else if ((key === 'duyun' && (queryLower === 'duyun' || queryLower === 'du yun' || 
              queryLower === '都匀' || queryLower.includes('都匀')))) {
      match = true;
    }
    // Also check alternatives
    else if (key.includes(queryLower) || 
             queryLower.includes(key) ||
             city.alternatives.some(alt => alt.includes(queryLower) || queryLower.includes(alt))) {
      match = true;
    }
    
    if (match) {
      // Adapt the returned location to the selected language
      const name = language === 'zh' ? city.chinese : city.name;
      const placeDetails = language === 'zh' ? 
        (city.placeDetails?.replace('in', '在').replace('Province', '省').replace('China', '中国') || '中国城市') : 
        city.placeDetails;
      
      results.push({
        name,
        placeDetails,
        latitude: city.coordinates[0],
        longitude: city.coordinates[1]
      });
    }
  }
  
  // Now let's look through the full location database
  const { locationDatabase } = require('../../../data/locationDatabase');
  
  const dbLocations: Location[] = locationDatabase.map((loc: any) => ({
    name: loc.name,
    placeDetails: loc.type ? `${loc.type} location` : undefined,
    latitude: loc.coordinates[0],
    longitude: loc.coordinates[1]
  }));
  
  // Find matching locations from the database
  const matchingLocations = findBestMatches(dbLocations, query, language);
  
  // Combine results
  const combinedResults = [...results, ...matchingLocations];
  
  // Prioritize Chinese locations for Chinese language and queries
  if (language === 'zh' || hasChineseChars) {
    combinedResults.sort((a, b) => {
      const aHasChinese = containsChineseCharacters(a.name);
      const bHasChinese = containsChineseCharacters(b.name);
      
      if (aHasChinese && !bHasChinese) return -1;
      if (!aHasChinese && bHasChinese) return 1;
      return 0;
    });
  }
  
  // Remove duplicates based on name
  const uniqueResults = combinedResults.filter((location, index, self) =>
    index === self.findIndex(l => l.name === location.name)
  );
  
  return uniqueResults.slice(0, limit);
}

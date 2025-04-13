
import { Location } from './types';

/**
 * Find matches for small towns that might not be in the main database
 * Enhanced with more small towns and improved matching
 * @param query Search query
 * @returns Array of matching small town locations
 */
export function findSmallTownMatches(query: string): Location[] {
  // This is a stub implementation for now
  // In the future, this should contain a database of small towns
  // that are not included in the main database
  
  const queryLower = query.trim().toLowerCase();
  
  // Basic small towns database for exact matches only
  const smallTowns: Record<string, Location> = {
    // US small towns
    "bishop": {
      name: "Bishop, California, USA",
      latitude: 37.3614,
      longitude: -118.3997
    },
    "moab": {
      name: "Moab, Utah, USA",
      latitude: 38.5733,
      longitude: -109.5498
    },
    "sedona": {
      name: "Sedona, Arizona, USA",
      latitude: 34.8697,
      longitude: -111.7601
    },
    "taos": {
      name: "Taos, New Mexico, USA",
      latitude: 36.4072,
      longitude: -105.5731
    },
    // Dark Sky Locations - Additional accurate data
    "flagstaff": {
      name: "Flagstaff Dark Sky City, Arizona, USA",
      chineseName: "弗拉格斯塔夫暗夜城市, 亚利桑那州, 美国",
      latitude: 35.1983,
      longitude: -111.6513,
      placeDetails: "World's First International Dark Sky City"
    },
    "borrego springs": {
      name: "Borrego Springs Dark Sky Community, California, USA",
      chineseName: "博雷戈泉暗夜社区, 加利福尼亚州, 美国",
      latitude: 33.2558,
      longitude: -116.3753,
      placeDetails: "Dark Sky Community - International Dark Sky Association"
    },
    "westcliffe": {
      name: "Westcliffe Dark Sky Community, Colorado, USA",
      chineseName: "韦斯特克利夫暗夜社区, 科罗拉多州, 美国",
      latitude: 38.1350,
      longitude: -105.4661,
      placeDetails: "Dark Sky Community - International Dark Sky Association"
    },
    "headlands": {
      name: "Headlands International Dark Sky Park, Michigan, USA",
      chineseName: "海德兰兹国际暗夜公园, 密歇根州, 美国",
      latitude: 45.7808,
      longitude: -84.9080,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "grand canyon": {
      name: "Grand Canyon National Park Dark Sky Park, Arizona, USA",
      chineseName: "大峡谷国家公园暗夜公园, 亚利桑那州, 美国",
      latitude: 36.0570,
      longitude: -112.1391,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "big bend": {
      name: "Big Bend National Park Dark Sky Park, Texas, USA",
      chineseName: "大弯国家公园暗夜公园, 德克萨斯州, 美国",
      latitude: 29.2498,
      longitude: -103.2502,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "clayton lake": {
      name: "Clayton Lake State Park Dark Sky Park, New Mexico, USA",
      chineseName: "克莱顿湖州立公园暗夜公园, 新墨西哥州, 美国",
      latitude: 36.5841,
      longitude: -103.3163,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "copper breaks": {
      name: "Copper Breaks State Park Dark Sky Park, Texas, USA",
      chineseName: "铜断裂州立公园暗夜公园, 德克萨斯州, 美国",
      latitude: 34.1075,
      longitude: -99.7481,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    // Additional dark sky locations
    "death valley": {
      name: "Death Valley National Park Dark Sky Park, California, USA",
      chineseName: "死亡谷国家公园暗夜公园, 加利福尼亚州, 美国",
      latitude: 36.5323,
      longitude: -116.9325,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "joshua tree": {
      name: "Joshua Tree National Park Dark Sky Park, California, USA",
      chineseName: "约书亚树国家公园暗夜公园, 加利福尼亚州, 美国",
      latitude: 33.8734,
      longitude: -115.9010,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "chaco culture": {
      name: "Chaco Culture National Historical Park Dark Sky Park, New Mexico, USA",
      chineseName: "查科文化国家历史公园暗夜公园, 新墨西哥州, 美国",
      latitude: 36.0319,
      longitude: -107.9698,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "arches": {
      name: "Arches National Park Dark Sky Park, Utah, USA",
      chineseName: "拱门国家公园暗夜公园, 犹他州, 美国",
      latitude: 38.7331,
      longitude: -109.5925,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "canyonlands": {
      name: "Canyonlands National Park Dark Sky Park, Utah, USA",
      chineseName: "峡谷地国家公园暗夜公园, 犹他州, 美国",
      latitude: 38.2136,
      longitude: -109.9025,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "enchanted rock": {
      name: "Enchanted Rock State Natural Area Dark Sky Park, Texas, USA",
      chineseName: "魔法石州立自然区暗夜公园, 德克萨斯州, 美国",
      latitude: 30.4949,
      longitude: -98.8192,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "capulin volcano": {
      name: "Capulin Volcano National Monument Dark Sky Park, New Mexico, USA",
      chineseName: "卡普林火山国家纪念碑暗夜公园, 新墨西哥州, 美国",
      latitude: 36.7811,
      longitude: -103.9695,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "tonto": {
      name: "Tonto National Monument Dark Sky Park, Arizona, USA",
      chineseName: "汤托国家纪念碑暗夜公园, 亚利桑那州, 美国",
      latitude: 33.6553,
      longitude: -110.9143,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "waterton glacier": {
      name: "Waterton-Glacier International Peace Park Dark Sky Park, Montana, USA & Alberta, Canada",
      chineseName: "沃特顿-冰川国际和平公园暗夜公园, 蒙大拿州, 美国及艾伯塔省, 加拿大",
      latitude: 48.9977,
      longitude: -113.9111,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "bruce peninsula": {
      name: "Bruce Peninsula National Park Dark Sky Preserve, Ontario, Canada",
      chineseName: "布鲁斯半岛国家公园暗夜保护区, 安大略省, 加拿大",
      latitude: 45.2292,
      longitude: -81.5264,
      placeDetails: "Dark Sky Preserve - Royal Astronomical Society of Canada"
    },
    // East Asian Dark Sky locations
    "xichong": {
      name: "Shenzhen Xichong Dark Sky Community, China",
      chineseName: "深圳西冲暗夜社区, 中国",
      latitude: 22.5808,
      longitude: 114.5034,
      placeDetails: "Dark Sky Community - International Dark Sky Association"
    },
    "yeongyang firefly": {
      name: "Yeongyang Firefly International Dark Sky Park, South Korea",
      chineseName: "英阳萤火虫国际暗夜公园, 韩国",
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
    "iriomote": {
      name: "Iriomote-Ishigaki National Park Dark Sky Reserve, Japan",
      chineseName: "西表石垣国家公园暗夜保护区, 日本",
      latitude: 24.3423,
      longitude: 124.1546,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "yaeyama": {
      name: "Yaeyama Islands International Dark Sky Reserve, Japan",
      chineseName: "八重山群岛国际暗夜保护区, 日本",
      latitude: 24.4667,
      longitude: 124.2167,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "ishigaki": {
      name: "Iriomote-Ishigaki National Park Dark Sky Reserve, Japan",
      chineseName: "西表石垣国家公园暗夜保护区, 日本",
      latitude: 24.3423,
      longitude: 124.1546,
      placeDetails: "Dark Sky Reserve - International Dark Sky Association"
    },
    "himawari": {
      name: "Himawari Farm Dark Sky Park, Japan",
      chineseName: "向日葵农场暗夜公园, 日本",
      latitude: 42.9824, 
      longitude: 140.9946,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    }
  };
  
  // Check for exact matches
  if (smallTowns[queryLower]) {
    return [smallTowns[queryLower]];
  }
  
  // Check for partial matches with improved algorithm
  const partialMatches: Location[] = [];
  Object.keys(smallTowns).forEach(townName => {
    // Check if query is contained within town name or town name is contained within query
    if (townName.includes(queryLower) || queryLower.includes(townName)) {
      partialMatches.push(smallTowns[townName]);
    } 
    // Check for word matches (e.g. "dark sky" in "flagstaff dark sky")
    else if (queryLower.split(' ').some(word => 
      word.length > 2 && townName.includes(word)) || 
      townName.split(' ').some(word => 
        word.length > 2 && queryLower.includes(word))) {
      partialMatches.push(smallTowns[townName]);
    }
  });
  
  // If query contains "dark sky", "dark-sky", "ida", or other astronomy terms, include all dark sky locations
  if (queryLower.includes('dark sky') || 
      queryLower.includes('dark-sky') || 
      queryLower.includes('ida') ||
      queryLower.includes('star') ||
      queryLower.includes('astronomy') ||
      queryLower.includes('night sky') ||
      queryLower.includes('milky way')) {
    // Find all dark sky locations
    Object.values(smallTowns).forEach(town => {
      if ((town.name && 
          (town.name.toLowerCase().includes('dark sky') || 
           town.name.toLowerCase().includes('dark-sky'))) ||
          (town.placeDetails && 
           town.placeDetails.toLowerCase().includes('dark sky'))) {
        // Avoid duplicates
        if (!partialMatches.some(match => match.name === town.name)) {
          partialMatches.push(town);
        }
      }
    });
  }
  
  return partialMatches;
}

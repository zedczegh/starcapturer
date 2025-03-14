import { Location } from './types';

// Common well-known locations for fallback
export const commonLocations: Location[] = [
  { name: "Beijing", placeDetails: "Beijing, China", latitude: 39.9042, longitude: 116.4074 },
  { name: "Shanghai", placeDetails: "Shanghai, China", latitude: 31.2304, longitude: 121.4737 },
  { name: "Hong Kong", placeDetails: "Hong Kong SAR", latitude: 22.3193, longitude: 114.1694 },
  { name: "Guangzhou", placeDetails: "Guangdong, China", latitude: 23.1291, longitude: 113.2644 },
  { name: "Shenzhen", placeDetails: "Guangdong, China", latitude: 22.5431, longitude: 114.0579 },
  { name: "Chengdu", placeDetails: "Sichuan, China", latitude: 30.5728, longitude: 104.0668 },
  { name: "Zhangjiajie", placeDetails: "Hunan, China", latitude: 29.1174, longitude: 110.4794 },
  { name: "Xi'an", placeDetails: "Shaanxi, China", latitude: 34.3416, longitude: 108.9398 },
  { name: "Lhasa", placeDetails: "Tibet, China", latitude: 29.6500, longitude: 91.1000 },
  { name: "Urumqi", placeDetails: "Xinjiang, China", latitude: 43.8256, longitude: 87.6168 },
  { name: "Harbin", placeDetails: "Heilongjiang, China", latitude: 45.8038, longitude: 126.5340 },
  { name: "Nanning", placeDetails: "Guangxi, China", latitude: 22.8170, longitude: 108.3665 },
  { name: "Guiyang", placeDetails: "Guizhou, China", latitude: 26.5833, longitude: 106.7167 },
  { name: "Hohhot", placeDetails: "Inner Mongolia, China", latitude: 40.8424, longitude: 111.7496 },
  { name: "Kunming", placeDetails: "Yunnan, China", latitude: 24.8801, longitude: 102.8329 },
  { name: "Wuhan", placeDetails: "Hubei, China", latitude: 30.5928, longitude: 114.3055 },
  { name: "Changsha", placeDetails: "Hunan, China", latitude: 28.2282, longitude: 112.9388 },
  { name: "Nanjing", placeDetails: "Jiangsu, China", latitude: 32.0617, longitude: 118.7778 },
  { name: "Hangzhou", placeDetails: "Zhejiang, China", latitude: 30.2741, longitude: 120.1551 },
  { name: "Chongqing", placeDetails: "Chongqing, China", latitude: 29.4316, longitude: 106.9123 }
];

// Additional international locations
export const internationalLocations: Location[] = [
  { name: "New York", placeDetails: "New York, NY, USA", latitude: 40.7128, longitude: -74.0060 },
  { name: "Los Angeles", placeDetails: "Los Angeles, CA, USA", latitude: 34.0522, longitude: -118.2437 },
  { name: "Chicago", placeDetails: "Chicago, IL, USA", latitude: 41.8781, longitude: -87.6298 },
  { name: "London", placeDetails: "London, United Kingdom", latitude: 51.5074, longitude: -0.1278 },
  { name: "Paris", placeDetails: "Paris, France", latitude: 48.8566, longitude: 2.3522 },
  { name: "Tokyo", placeDetails: "Tokyo, Japan", latitude: 35.6762, longitude: 139.6503 },
  { name: "Sydney", placeDetails: "Sydney, Australia", latitude: -33.8688, longitude: 151.2093 },
  { name: "Dubai", placeDetails: "Dubai, UAE", latitude: 25.2048, longitude: 55.2708 },
  { name: "Door County", placeDetails: "Door County, WI, USA", latitude: 45.0153, longitude: -87.2454 },
  { name: "Yellowstone", placeDetails: "Yellowstone National Park, WY, USA", latitude: 44.4280, longitude: -110.5885 },
  { name: "Yosemite", placeDetails: "Yosemite National Park, CA, USA", latitude: 37.8651, longitude: -119.5383 },
  { name: "Grand Canyon", placeDetails: "Grand Canyon, AZ, USA", latitude: 36.1069, longitude: -112.1129 },
  { name: "California", placeDetails: "California, USA", latitude: 36.7014631, longitude: -118.755997 },
  { name: "北京", placeDetails: "北京市, 中国", latitude: 39.9042, longitude: 116.4074 },
  { name: "上海", placeDetails: "上海市, 中国", latitude: 31.2304, longitude: 121.4737 },
  { name: "香港", placeDetails: "香港特别行政区", latitude: 22.3193, longitude: 114.1694 },
  { name: "广州", placeDetails: "广东省, 中国", latitude: 23.1291, longitude: 113.2644 },
  { name: "深圳", placeDetails: "广东省, 中国", latitude: 22.5431, longitude: 114.0579 },
  { name: "南宁", placeDetails: "广西壮族自治区, 中国", latitude: 22.8170, longitude: 108.3665 },
  { name: "贵阳", placeDetails: "贵州省, 中国", latitude: 26.5833, longitude: 106.7167 },
  { name: "呼和浩特", placeDetails: "内蒙古自治区, 中国", latitude: 40.8424, longitude: 111.7496 },
  { name: "昆明", placeDetails: "云南省, 中国", latitude: 24.8801, longitude: 102.8329 },
  { name: "武汉", placeDetails: "湖北省, 中国", latitude: 30.5928, longitude: 114.3055 },
  { name: "长沙", placeDetails: "湖南省, 中国", latitude: 28.2282, longitude: 112.9388 },
  { name: "南京", placeDetails: "江苏省, 中国", latitude: 32.0617, longitude: 118.7778 },
  { name: "杭州", placeDetails: "浙江省, 中国", latitude: 30.2741, longitude: 120.1551 },
  { name: "重庆", placeDetails: "重庆市, 中国", latitude: 29.4316, longitude: 106.9123 }
];

// Additional Chinese cities with alternative spellings
export const chineseCityAlternatives: Record<string, { 
  name: string, 
  chinese: string, 
  alternatives: string[], 
  placeDetails: string,
  coordinates: [number, number]
}> = {
  "nanning": {
    name: "Nanning",
    chinese: "南宁",
    alternatives: ["naning", "nanling", "namning", "nan-ning", "nanin", "nanin", "nannin"],
    placeDetails: "Guangxi, China",
    coordinates: [22.8170, 108.3665]
  },
  "guiyang": {
    name: "Guiyang",
    chinese: "贵阳",
    alternatives: ["guiyang", "kuiyang", "gwiyang", "gui yang", "gui-yang", "guiyan", "guiyan", "guyang"],
    placeDetails: "Guizhou, China",
    coordinates: [26.5833, 106.7167]
  },
  "hohhot": {
    name: "Hohhot",
    chinese: "呼和浩特",
    alternatives: ["huhehaote", "huhehot", "huhehaot", "hohhot", "huhhot", "huhe", "huhehaot", "huhehao", "huhehaote", "hu he hao te", "huhe", "huhehao"],
    placeDetails: "Inner Mongolia, China",
    coordinates: [40.8424, 111.7496]
  },
  "kunming": {
    name: "Kunming",
    chinese: "昆明",
    alternatives: ["kumming", "cunming", "kunming", "kun ming", "kun-ming", "kunmin", "kunmming"],
    placeDetails: "Yunnan, China",
    coordinates: [24.8801, 102.8329]
  },
  "beijing": {
    name: "Beijing",
    chinese: "北京",
    alternatives: ["beiging", "peiking", "peking", "bei jing", "bei-jing", "beijin", "beiji", "beijng"],
    placeDetails: "Beijing, China",
    coordinates: [39.9042, 116.4074]
  },
  "shanghai": {
    name: "Shanghai",
    chinese: "上海",
    alternatives: ["shangai", "shanghi", "shang hai", "shang-hai", "shangha", "shangha", "shangh"],
    placeDetails: "Shanghai, China",
    coordinates: [31.2304, 121.4737]
  },
  "chengdu": {
    name: "Chengdu",
    chinese: "成都",
    alternatives: ["chengtu", "chendu", "cheng du", "cheng-du", "chengd", "chengdu", "chendu"],
    placeDetails: "Sichuan, China",
    coordinates: [30.5728, 104.0668]
  },
  "chongqing": {
    name: "Chongqing",
    chinese: "重庆",
    alternatives: ["chungking", "chongching", "chongqin", "chong qing", "chong-qing", "chongq", "chongq", "zhongqin"],
    placeDetails: "Chongqing, China",
    coordinates: [29.4316, 106.9123]
  },
  "guangzhou": {
    name: "Guangzhou",
    chinese: "广州",
    alternatives: ["canton", "guanzhou", "guangjou", "guang zhou", "guang-zhou", "guangzh", "guangzh", "guangzhu"],
    placeDetails: "Guangdong, China",
    coordinates: [23.1291, 113.2644]
  },
  "shenzhen": {
    name: "Shenzhen",
    chinese: "深圳",
    alternatives: ["shenzen", "shenchun", "shen zhen", "shen-zhen", "shenzh", "shenzh", "shenzhe"],
    placeDetails: "Guangdong, China",
    coordinates: [22.5431, 114.0579]
  },
  "hangzhou": {
    name: "Hangzhou", 
    chinese: "杭州",
    alternatives: ["hangchow", "hangchou", "hang zhou", "hang-zhou", "hangzh", "hangzh", "hanzhou"],
    placeDetails: "Zhejiang, China",
    coordinates: [30.2741, 120.1551]
  },
  "wuhan": {
    name: "Wuhan",
    chinese: "武汉",
    alternatives: ["wuhaan", "wuchan", "wu han", "wu-han", "wuha", "wuha", "whan"],
    placeDetails: "Hubei, China",
    coordinates: [30.5928, 114.3055]
  },
  "xian": {
    name: "Xi'an",
    chinese: "西安",
    alternatives: ["xi'an", "xian", "sian", "xi an", "xi-an", "xian", "xia", "xian"],
    placeDetails: "Shaanxi, China",
    coordinates: [34.3416, 108.9398]
  }
};

/**
 * Find locations matching a query from our internal database
 * @param query Search query string
 * @param limit Maximum number of results to return
 * @returns Array of matching locations
 */
export function findMatchingLocations(query: string, limit: number = 5): Location[] {
  if (!query || query.trim().length === 0) return [];
  
  const queryLower = query.toLowerCase().trim();
  const results: Location[] = [];
  
  // Search common locations
  for (const location of commonLocations) {
    if (location.name.toLowerCase().includes(queryLower)) {
      results.push(location);
      if (results.length >= limit) break;
    }
  }
  
  // If we still need more results, search international locations
  if (results.length < limit) {
    for (const location of internationalLocations) {
      if (location.name.toLowerCase().includes(queryLower) && 
          !results.some(r => r.name === location.name)) {
        results.push(location);
        if (results.length >= limit) break;
      }
    }
  }
  
  // Check alternative spellings for Chinese cities
  if (results.length < limit) {
    for (const [key, cityInfo] of Object.entries(chineseCityAlternatives)) {
      if ((key.includes(queryLower) || 
           cityInfo.chinese.includes(queryLower) ||
           cityInfo.alternatives.some(alt => alt.includes(queryLower))) &&
          !results.some(r => r.name === cityInfo.name)) {
        results.push({
          name: cityInfo.name,
          placeDetails: cityInfo.placeDetails,
          latitude: cityInfo.coordinates[0],
          longitude: cityInfo.coordinates[1]
        });
        if (results.length >= limit) break;
      }
    }
  }
  
  return results;
}

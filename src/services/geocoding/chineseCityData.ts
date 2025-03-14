
import { Location } from './types';

/**
 * Chinese city names and their alternatives for better searching
 */
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
  "xuhui": {
    name: "Xuhui District, Shanghai, China",
    chinese: "徐汇区，上海",
    alternatives: ["xu hui", "徐汇", "徐汇区", "上海徐汇", "徐匯"],
    coordinates: [31.1889, 121.4361],
    placeDetails: "District in Shanghai"
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
  "nanming": {
    name: "Nanming District, Guiyang, China",
    chinese: "南明区，贵阳",
    alternatives: ["nan ming", "南明", "南明区", "贵阳南明", "南明贵阳"],
    coordinates: [26.5676, 106.7144],
    placeDetails: "District in Guiyang"
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
  },
  // New suburban districts
  "changping": {
    name: "Changping District, Beijing, China",
    chinese: "昌平区，北京",
    alternatives: ["chang ping", "昌平", "昌平区", "北京昌平"],
    coordinates: [40.2208, 116.2312],
    placeDetails: "Suburban district of Beijing"
  },
  "jiading": {
    name: "Jiading District, Shanghai, China",
    chinese: "嘉定区，上海",
    alternatives: ["jia ding", "嘉定", "嘉定区", "上海嘉定"],
    coordinates: [31.3838, 121.2642],
    placeDetails: "Suburban district of Shanghai"
  },
  "songjiang": {
    name: "Songjiang District, Shanghai, China",
    chinese: "松江区，上海",
    alternatives: ["song jiang", "松江", "松江区", "上海松江"],
    coordinates: [31.0303, 121.2277],
    placeDetails: "Suburban district of Shanghai"
  },
  "panyu": {
    name: "Panyu District, Guangzhou, China",
    chinese: "番禺区，广州",
    alternatives: ["pan yu", "番禺", "番禺区", "广州番禺"],
    coordinates: [22.9375, 113.3839],
    placeDetails: "Suburban district of Guangzhou"
  },
  "huadu": {
    name: "Huadu District, Guangzhou, China",
    chinese: "花都区，广州",
    alternatives: ["hua du", "花都", "花都区", "广州花都"],
    coordinates: [23.4037, 113.2208],
    placeDetails: "Suburban district of Guangzhou"
  },
  "longquanyi": {
    name: "Longquanyi District, Chengdu, China",
    chinese: "龙泉驿区，成都",
    alternatives: ["long quan yi", "龙泉驿", "龙泉驿区", "成都龙泉驿"],
    coordinates: [30.5526, 104.2486],
    placeDetails: "Suburban district of Chengdu"
  },
  "xiaoshan": {
    name: "Xiaoshan District, Hangzhou, China",
    chinese: "萧山区，杭州",
    alternatives: ["xiao shan", "萧山", "萧山区", "杭州萧山"],
    coordinates: [30.1664, 120.2584],
    placeDetails: "Suburban district of Hangzhou"
  },
  "jiangning": {
    name: "Jiangning District, Nanjing, China",
    chinese: "江宁区，南京",
    alternatives: ["jiang ning", "江宁", "江宁区", "南京江宁"],
    coordinates: [31.9523, 118.8399],
    placeDetails: "Suburban district of Nanjing"
  },
  "changan": {
    name: "Chang'an District, Xi'an, China",
    chinese: "长安区，西安",
    alternatives: ["chang an", "长安", "长安区", "西安长安"],
    coordinates: [33.9449, 108.9071],
    placeDetails: "Suburban district of Xi'an"
  }
};

/**
 * Check alternative spellings for Chinese locations
 */
export function checkAlternativeSpellings(query: string): Location[] {
  const results: Location[] = [];
  const queryLower = query.toLowerCase().trim();

  // Try to match against our alternative spellings database
  for (const [key, city] of Object.entries(chineseCityAlternatives)) {
    // Check for exact matches first (higher priority)
    const exactMatch = 
      city.chinese === queryLower || 
      city.alternatives.includes(queryLower) ||
      key === queryLower;
      
    // Check for partial matches (lower priority)
    const partialMatch = 
      !exactMatch && (
        city.chinese.includes(queryLower) || 
        queryLower.includes(city.chinese) ||
        city.alternatives.some(alt => alt.includes(queryLower) || queryLower.includes(alt)) ||
        key.includes(queryLower) ||
        queryLower.includes(key)
      );
      
    if (exactMatch || partialMatch) {
      results.push({
        name: city.name,
        latitude: city.coordinates[0],
        longitude: city.coordinates[1],
        placeDetails: city.placeDetails
      });
      
      // For exact matches, also return the Chinese version
      if (exactMatch) {
        results.push({
          name: city.chinese,
          latitude: city.coordinates[0],
          longitude: city.coordinates[1],
          placeDetails: city.placeDetails
        });
      }
    }
  }
  
  // Sort exact matches before partial matches
  return results;
}

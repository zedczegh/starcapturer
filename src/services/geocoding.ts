import { locationDatabase } from "@/utils/locationUtils";
import { Location } from "@/components/MapSelector";

// Common well-known locations for fallback
const commonLocations: Location[] = [
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
const internationalLocations: Location[] = [
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
const chineseCityAlternatives: Record<string, { 
  name: string, 
  chinese: string, 
  alternatives: string[], 
  placeDetails: string,
  coordinates: [number, number]
}> = {
  "nanning": {
    name: "Nanning",
    chinese: "南宁",
    alternatives: ["naning", "nanling", "namning", "nan ning", "nan-ning", "nanin", "nanin", "nannin"],
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

// Chinese pinyin-specific matching
// Map common pinyin syllables to possible variations when typing quickly
const pinyinVariations: Record<string, string[]> = {
  'zh': ['z', 'j'],
  'ch': ['c', 'q'],
  'sh': ['s', 'x'],
  'ang': ['an', 'ang', 'ag'],
  'eng': ['en', 'eng', 'eg'],
  'ing': ['in', 'ing', 'ig'],
  'ong': ['on', 'ong', 'og'],
  'ian': ['ian', 'iam', 'yan'],
  'uan': ['uan', 'wan'],
  'uang': ['uang', 'wang'],
};

// Helper function to generate pinyin variations
function generatePinyinVariations(input: string): string[] {
  let variations: string[] = [input];
  
  // Generate basic variations with space/hyphen between syllables
  if (input.length > 2) {
    for (let i = 2; i < input.length; i++) {
      const withSpace = input.slice(0, i) + ' ' + input.slice(i);
      const withHyphen = input.slice(0, i) + '-' + input.slice(i);
      variations.push(withSpace, withHyphen);
    }
  }
  
  // Apply pinyin-specific variations
  Object.entries(pinyinVariations).forEach(([standard, variants]) => {
    variants.forEach(variant => {
      if (variant !== standard) {
        const regex = new RegExp(variant, 'g');
        if (input.match(regex)) {
          variations.push(input.replace(regex, standard));
        }
        
        const standardRegex = new RegExp(standard, 'g');
        if (input.match(standardRegex)) {
          variations.push(input.replace(standardRegex, variant));
        }
      }
    });
  });
  
  return [...new Set(variations)]; // Remove duplicates
}

// Match score function to improve search relevance
function getMatchScore(location: string, query: string): number {
  const locationLower = location.toLowerCase();
  const queryLower = query.toLowerCase();
  
  if (locationLower === queryLower) return 100;
  
  if (locationLower.startsWith(queryLower)) return 90;
  
  const words = locationLower.split(/\s+/);
  for (const word of words) {
    if (word === queryLower) return 80;
    if (word.startsWith(queryLower)) return 70;
  }
  
  if (locationLower.includes(queryLower)) return 60;
  
  for (const word of words) {
    if (word.includes(queryLower)) return 40;
  }
  
  // Increase search flexibility for Chinese characters and pinyin
  if (queryLower.length >= 1 && /[\u4e00-\u9fa5]/.test(queryLower)) { // Chinese character detection
    const commonChars = queryLower.split('').filter(char => locationLower.includes(char)).length;
    const matchPercentage = commonChars / queryLower.length;
    if (matchPercentage > 0.3) return 35; // More lenient for Chinese characters
  } else if (queryLower.length >= 2) { // For pinyin/latin characters
    const commonChars = queryLower.split('').filter(char => locationLower.includes(char)).length;
    const matchPercentage = commonChars / queryLower.length;
    if (matchPercentage > 0.5) return 30;
  }
  
  return 0;
}

// Soundex implementation for phonetic matching (useful for names that sound similar)
function soundex(s: string): string {
  const a = s.toLowerCase().split('');
  const firstLetter = a.shift();
  if (!firstLetter) return '';
  
  const codes = {
    b: 1, f: 1, p: 1, v: 1,
    c: 2, g: 2, j: 2, k: 2, q: 2, s: 2, x: 2, z: 2,
    d: 3, t: 3,
    l: 4,
    m: 5, n: 5,
    r: 6
  } as Record<string, number>;
  
  let output = firstLetter;
  let previous = -1;
  
  for (let i = 0; i < a.length; i++) {
    const current = codes[a[i]] || 0;
    if (current && current !== previous) {
      output += current;
    }
    previous = current;
  }
  
  return (output + '000').slice(0, 4);
}

// Check for alternative spellings and transliterations of Chinese cities
function checkAlternativeSpellings(query: string): Location[] {
  const results: Location[] = [];
  const queryLower = query.toLowerCase().trim();
  const queryVariations = generatePinyinVariations(queryLower);
  
  for (const [key, city] of Object.entries(chineseCityAlternatives)) {
    // Check if any query variation matches any alternative spelling
    const matchesAlternative = city.alternatives.some(alt => 
      queryVariations.some(qVar => 
        alt.includes(qVar) || qVar.includes(alt)
      )
    );
    
    // Check if query matches the key or Chinese name
    const matchesName = queryVariations.some(qVar => 
      key.includes(qVar) || qVar.includes(key)
    );
    const matchesChinese = queryVariations.some(qVar => 
      city.chinese.includes(qVar) || qVar.includes(city.chinese)
    );
    
    if (matchesAlternative || matchesName || matchesChinese) {
      results.push({ 
        name: city.name, 
        placeDetails: city.placeDetails, 
        latitude: city.coordinates[0], 
        longitude: city.coordinates[1] 
      });
    }
  }
  
  return results;
}

/**
 * Search for locations based on a query string
 * Enhanced to find any location worldwide using multiple data sources
 */
export async function searchLocations(query: string): Promise<Location[]> {
  if (!query || query.trim().length < 1) { // Reduced from < 2 to < 1 for better Chinese input support
    return [];
  }
  
  const lowercaseQuery = query.toLowerCase().trim();
  const queryVariations = generatePinyinVariations(lowercaseQuery);
  const allResults: Array<Location & { score: number }> = [];
  
  // First check alternative spellings which is especially important for Chinese cities
  const alternativeMatches = checkAlternativeSpellings(lowercaseQuery);
  alternativeMatches.forEach(match => {
    allResults.push({
      ...match,
      score: 95
    });
  });
  
  // Check against location database
  locationDatabase.forEach(location => {
    let highestScore = 0;
    
    // Try all query variations and use the highest score
    queryVariations.forEach(qVar => {
      const score = getMatchScore(location.name, qVar);
      highestScore = Math.max(highestScore, score);
    });
    
    if (highestScore > 0) {
      allResults.push({
        name: location.name,
        placeDetails: `${location.name}, Bortle Scale: ${location.bortleScale.toFixed(1)}`,
        latitude: location.coordinates[0],
        longitude: location.coordinates[1],
        score: highestScore
      });
    }
  });
  
  // Check against common and international locations
  const allLocations = [...commonLocations, ...internationalLocations];
  allLocations.forEach(location => {
    let highestNameScore = 0;
    let highestDetailScore = 0;
    
    // Try all query variations and use the highest score
    queryVariations.forEach(qVar => {
      const nameScore = getMatchScore(location.name, qVar);
      const detailScore = location.placeDetails ? getMatchScore(location.placeDetails, qVar) : 0;
      highestNameScore = Math.max(highestNameScore, nameScore);
      highestDetailScore = Math.max(highestDetailScore, detailScore);
    });
    
    const score = Math.max(highestNameScore, highestDetailScore);
    
    if (score > 0) {
      if (!allResults.some(r => r.name === location.name)) {
        allResults.push({
          ...location,
          score
        });
      }
    }
  });
  
  // Add special handling for Chinese-English translation
  if (allResults.length < 5) {
    const chineseToEnglish: Record<string, string> = {
      '北京': 'Beijing',
      '上海': 'Shanghai',
      '香港': 'Hong Kong',
      '广州': 'Guangzhou',
      '深圳': 'Shenzhen',
      '南宁': 'Nanning',
      '贵阳': 'Guiyang',
      '呼和浩特': 'Hohhot',
      '昆明': 'Kunming',
      '武汉': 'Wuhan',
      '长沙': 'Changsha',
      '南京': 'Nanjing',
      '杭州': 'Hangzhou',
      '重庆': 'Chongqing',
      '西安': 'Xi\'an',
      '成都': 'Chengdu'
    };
    
    const englishToChinese: Record<string, string> = {
      'beijing': '北京',
      'shanghai': '上海',
      'hong kong': '香港',
      'guangzhou': '广州',
      'shenzhen': '深圳',
      'nanning': '南宁',
      'guiyang': '贵阳',
      'hohhot': '呼和浩特',
      'kunming': '昆明',
      'wuhan': '武汉',
      'changsha': '长沙',
      'nanjing': '南京',
      'hangzhou': '杭州',
      'chongqing': '重庆',
      'xian': '西安',
      'chengdu': '成都'
    };
    
    // Check for Chinese character matches
    Object.entries(chineseToEnglish).forEach(([chinese, english]) => {
      queryVariations.forEach(qVar => {
        if (chinese.includes(qVar) || qVar.includes(chinese)) {
          const matchedLocation = allLocations.find(l => 
            l.name.toLowerCase() === english.toLowerCase()
          );
          
          if (matchedLocation && !allResults.some(r => r.name === matchedLocation.name)) {
            allResults.push({
              ...matchedLocation,
              score: 85
            });
          }
        }
      });
    });
    
    // Check for English/pinyin matches that should map to Chinese
    queryVariations.forEach(qVar => {
      Object.entries(englishToChinese).forEach(([english, chinese]) => {
        if (english.includes(qVar) || qVar.includes(english)) {
          const matchedLocation = allLocations.find(l => 
            l.name === chinese
          );
          
          if (matchedLocation && !allResults.some(r => r.name === matchedLocation.name)) {
            allResults.push({
              ...matchedLocation,
              score: 85
            });
          }
        }
      });
    });
    
    // Use soundex for phonetic matching
    const queryVariationSoundexes = queryVariations.map(qVar => soundex(qVar));
    allLocations.forEach(location => {
      const locationSoundex = soundex(location.name.toLowerCase());
      
      if (queryVariationSoundexes.some(qs => qs === locationSoundex) && 
          !allResults.some(r => r.name === location.name)) {
        allResults.push({
          ...location,
          score: 75
        });
      }
    });
  }
  
  // Query external APIs for locations not in our database
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=5&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SIQSCalculatorApp'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((item: any, index: number) => {
          const name = item.name || item.display_name.split(',')[0];
          
          let placeDetails = '';
          
          if (item.address) {
            const addressParts = [];
            
            if (item.address.county) addressParts.push(item.address.county);
            if (item.address.state) addressParts.push(item.address.state);
            if (item.address.country) addressParts.push(item.address.country);
            
            placeDetails = addressParts.join(', ');
          } else {
            placeDetails = item.display_name;
          }
          
          if (!allResults.some(r => 
              r.latitude === parseFloat(item.lat) && 
              r.longitude === parseFloat(item.lon)
          )) {
            allResults.push({
              name: name,
              placeDetails: placeDetails,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              score: 90 - index * 5
            });
          }
        });
      }
    }
  } catch (error) {
    console.error('Error querying Nominatim API:', error);
  }
  
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://photon.komoot.io/api/?q=${encodedQuery}&limit=5`;
    
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.features && Array.isArray(data.features)) {
        data.features.forEach((feature: any, index: number) => {
          const properties = feature.properties;
          const geometry = feature.geometry;
          
          if (geometry && geometry.coordinates && properties) {
            const name = properties.name || query;
            
            const addressParts = [];
            if (properties.city && !name.includes(properties.city)) addressParts.push(properties.city);
            if (properties.county && !name.includes(properties.county)) addressParts.push(properties.county);
            if (properties.state) addressParts.push(properties.state);
            if (properties.country) addressParts.push(properties.country);
            
            const placeDetails = addressParts.join(', ');
            
            const longitude = geometry.coordinates[0];
            const latitude = geometry.coordinates[1];
            
            if (!allResults.some(r => 
                Math.abs(r.latitude - latitude) < 0.01 && 
                Math.abs(r.longitude - longitude) < 0.01
            )) {
              allResults.push({
                name: name,
                placeDetails: placeDetails || `Location: ${name}`,
                latitude: latitude,
                longitude: longitude,
                score: 85 - index * 5
              });
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('Error querying Photon API:', error);
  }
  
  // If no results found, create a placeholder
  if (allResults.length === 0) {
    allResults.push({
      name: query,
      placeDetails: `Search result for: ${query}`,
      latitude: 30 + Math.random() * 20,
      longitude: 100 + Math.random() * 20,
      score: 10
    });
  }
  
  // Sort by score and return the top results
  return allResults
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ name, latitude, longitude, placeDetails }) => ({
      name, latitude, longitude, placeDetails
    }));
}

import { normalizeLongitude } from './coordinates';

/**
 * Enhanced function to get location name from coordinates
 * Now with better name resolution for places beyond Beijing and Hong Kong
 */
export async function getLocationNameFromCoordinates(
  latitude: number, 
  longitude: number,
  language: string = 'en'
): Promise<string> {
  try {
    // Normalize coordinates
    const validLat = Math.max(-90, Math.min(90, latitude));
    const validLng = normalizeLongitude(longitude);
    
    // First try open API for reverse geocoding
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${validLat}&lon=${validLng}&format=json&accept-language=${language}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SIQSCalculatorApp'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          // Extract the most relevant part (city or region)
          const parts = data.display_name.split(',');
          const cityOrRegion = parts.length > 1 ? parts[0].trim() : data.display_name;
          
          return cityOrRegion;
        }
      }
    } catch (error) {
      console.error("Error using Nominatim API:", error);
    }
    
    // Fallback to our database
    const { findClosestKnownLocation } = await import('../../utils/locationUtils');
    const closestLocation = findClosestKnownLocation(validLat, validLng);
    
    // If we're close to a known location, use its name or "Near X"
    if (closestLocation.distance <= 20) {
      return closestLocation.name;
    } else if (closestLocation.distance <= 100) {
      return language === 'en' 
        ? `Near ${closestLocation.name}` 
        : `${closestLocation.name}附近`;
    }
    
    // Last resort - use major city or region names based on approximate location
    const china = {
      north: ["Beijing Region", "北京地区"],
      northeast: ["Northeast China", "中国东北"],
      east: ["East China", "中国东部"],
      south: ["South China", "中国南部"],
      central: ["Central China", "中国中部"],
      west: ["Western China", "中国西部"],
      northwest: ["Northwest China", "中国西北"],
      southwest: ["Southwest China", "中国西南"],
    };
    
    // Simple region determination based on coordinates
    let region;
    if (validLat > 40) {
      if (validLng < 110) region = china.northwest;
      else region = china.northeast;
    } else if (validLat > 30) {
      if (validLng < 105) region = china.west;
      else if (validLng > 118) region = china.east;
      else region = china.central;
    } else {
      if (validLng < 105) region = china.southwest;
      else region = china.south;
    }
    
    return language === 'en' ? region[0] : region[1];
  } catch (error) {
    console.error('Error getting location name:', error);
    return language === 'en' 
      ? `Location at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°` 
      : `位置在 ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
  }
}

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

// Enhanced match score function with multi-word search support
function getMatchScore(location: string, query: string): number {
  const locationLower = location.toLowerCase();
  const queryLower = query.toLowerCase().trim();
  
  // Perfect match
  if (locationLower === queryLower) return 100;
  
  // Prefix match gets high priority (e.g. "cali" matching "california")
  if (locationLower.startsWith(queryLower)) return 98;

  // Split the query and location into words for better matching
  const queryWords = queryLower.split(/\s+/);
  const locationWords = locationLower.split(/\s+/);
  
  // Highly prioritize exact substring match (e.g. "cali" in "california")
  if (locationLower.includes(queryLower)) return 95;
  
  // Check if any location word starts with the query
  for (const word of locationWords) {
    if (word.startsWith(queryLower)) return 92;
  }
  
  // If this is a multi-word search
  if (queryWords.length > 1) {
    // Check if all query words are present in the location (regardless of order)
    const allWordsPresent = queryWords.every(word => locationLower.includes(word));
    if (allWordsPresent) return 90;
    
    // Check for consecutive word matches from the beginning
    let matchingWords = 0;
    for (let i = 0; i < Math.min(queryWords.length, locationWords.length); i++) {
      if (locationWords[i].startsWith(queryWords[i])) {
        matchingWords++;
      } else {
        break;
      }
    }
    
    if (matchingWords > 0) {
      // Higher score for more consecutive word matches
      return 85 + matchingWords;
    }
    
    // Check exact match for any individual word in the query against any word in the location
    for (const queryWord of queryWords) {
      for (const locationWord of locationWords) {
        if (locationWord === queryWord) {
          return 84;
        }
      }
    }

    // Count how many words from the query match words in the location
    let matchingWordCount = 0;
    for (const queryWord of queryWords) {
      for (const locationWord of locationWords) {
        if (locationWord.includes(queryWord) || queryWord.includes(locationWord)) {
          matchingWordCount++;
          break;
        }
      }
    }
    
    if (matchingWordCount > 0) {
      // Score based on the percentage of query words that match
      return 80 + ((matchingWordCount / queryWords.length) * 3);
    }
  }
  
  // Exact word match
  for (const word of locationWords) {
    if (word === queryLower) return 80;
  }
  
  // Word contains query
  for (const word of locationWords) {
    if (word.includes(queryLower)) return 75;
  }
  
  // Partial word matching
  if (queryLower.length >= 2) {
    for (const word of locationWords) {
      if (word.startsWith(queryLower.substring(0, Math.min(word.length, queryLower.length)))) {
        const matchLength = Math.min(queryLower.length, word.length);
        const matchPercentage = matchLength / word.length;
        return 60 + (matchPercentage * 15); 
      }
    }
  }
  
  // First letter matches beginning of a word
  if (queryLower.length === 1) {
    for (const word of locationWords) {
      if (word.startsWith(queryLower)) {
        return 40;
      }
    }
  }
  
  // Special handling for Chinese characters
  if (queryLower.length >= 1 && /[\u4e00-\u9fa5]/.test(queryLower)) { 
    const commonChars = queryLower.split('').filter(char => locationLower.includes(char)).length;
    const matchPercentage = commonChars / queryLower.length;
    if (matchPercentage > 0.5) return 50;
    if (matchPercentage > 0.3) return 40;
  } else if (queryLower.length >= 1) { 
    const commonChars = queryLower.split('').filter(char => locationLower.includes(char)).length;
    const matchPercentage = commonChars / queryLower.length;
    if (matchPercentage > 0.7) return 35;
    if (matchPercentage > 0.5) return 30;
  }
  
  return 0;
}

// Soundex implementation for phonetic matching
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

// Check for alternative spellings and transliterations with multi-word support
function checkAlternativeSpellings(query: string): Location[] {
  const results: Location[] = [];
  const queryLower = query.toLowerCase().trim();
  
  // Generate variations for the whole query
  const queryVariations = generatePinyinVariations(queryLower);
  
  // Also generate variations for each word in multi-word queries
  const queryWords = queryLower.split(/\s+/);
  const perWordVariations: string[] = [];
  
  if (queryWords.length > 1) {
    queryWords.forEach(word => {
      perWordVariations.push(...generatePinyinVariations(word));
    });
  }
  
  const allVariations = [...new Set([...queryVariations, ...perWordVariations])];
  
  for (const [key, city] of Object.entries(chineseCityAlternatives)) {
    // Check if any query variation matches any alternative spelling
    const matchesAlternative = city.alternatives.some(alt => 
      allVariations.some(qVar => 
        alt.includes(qVar) || qVar.includes(alt)
      )
    );
    
    // Check if query matches the key or Chinese name
    const matchesName = allVariations.some(qVar => 
      key.includes(qVar) || qVar.includes(key)
    );
    const matchesChinese = allVariations.some(qVar => 
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
 * And improved to handle language preferences and multi-word searches
 */
export async function searchLocations(query: string, language: Language = 'en'): Promise<Location[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  const lowercaseQuery = query.toLowerCase().trim();
  const queryWords = lowercaseQuery.split(/\s+/);
  const queryVariations = generatePinyinVariations(lowercaseQuery);
  const allResults: Array<Location & { score: number }> = [];
  
  // Check if the query is specifically looking for California
  if (lowercaseQuery === 'cal' || 
      lowercaseQuery === 'cali' || 
      lowercaseQuery === 'calif' || 
      lowercaseQuery.startsWith('califo') || 
      lowercaseQuery.startsWith('calif ')) {
    allResults.push({
      name: "California",
      placeDetails: "California, USA",
      latitude: 36.7014631,
      longitude: -118.755997,
      score: 100
    });
  }

  // Check against alternative spellings
  const alternativeMatches = checkAlternativeSpellings(lowercaseQuery);
  alternativeMatches.forEach(match => {
    allResults.push({
      ...match,
      score: 95
    });
  });
  
  // Import and process location database
  const { locationDatabase } = await import('@/utils/locationUtils');
  locationDatabase.forEach(location => {
    let highestScore = 0;
    
    // Try all query variations and use the highest score
    queryVariations.forEach(qVar => {
      const score = getMatchScore(location.name, qVar);
      highestScore = Math.max(highestScore, score);
    });
    
    // For multi-word queries, also check each word individually
    if (queryWords.length > 1) {
      queryWords.forEach(word => {
        if (word.length >= 2) { // Only check words with 2+ characters
          const score = getMatchScore(location.name, word) * 0.9; // Slightly lower score for partial matches
          highestScore = Math.max(highestScore, score);
        }
      });
    }
    
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
  
  // Process standardized location database, prioritizing exact matches
  const locationList = language === 'zh' 
    ? [...internationalLocations.filter(loc => /[\u4e00-\u9fa5]/.test(loc.name)), ...commonLocations]
    : [...internationalLocations.filter(loc => !/[\u4e00-\u9fa5]/.test(loc.name)), ...commonLocations];

  locationList.forEach(location => {
    let highestScore = 0;
    
    // Try all query variations
    queryVariations.forEach(qVar => {
      // Calculate score based on name and details
      const nameScore = getMatchScore(location.name, qVar);
      const detailScore = location.placeDetails ? getMatchScore(location.placeDetails, qVar) * 0.9 : 0;
      highestScore = Math.max(highestScore, nameScore, detailScore);
    });
    
    if (highestScore > 0) {
      // Avoid duplicates
      if (!allResults.some(r => r.name === location.name)) {
        allResults.push({
          ...location,
          score: highestScore
        });
      }
    }
  });
  
  // Only add exact match translations between Chinese and English if we have few results
  if (allResults.length < 3) {
    // ... keep existing code (language-specific handling) the same
  }
  
  // Add phonetic matches only if we have few results
  if (allResults.length < 3) {
    // ... keep existing code (phonetic matching) the same
  }
  
  // Query external APIs with language preference
  try {
    const encodedQuery = encodeURIComponent(query);
    const languageParam = language === 'zh' ? '&accept-language=zh-CN' : '';
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}${languageParam}&format=json&limit=5&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SIQSCalculatorApp',
        'Accept-Language': language === 'zh' ? 'zh-CN' : 'en-US'
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
          
          // Calculate match score to only add relevant matches
          const score = getMatchScore(name, lowercaseQuery);
          
          if (score > 50 && !allResults.some(r => 
              r.latitude === parseFloat(item.lat) && 
              r.longitude === parseFloat(item.lon)
          )) {
            allResults.push({
              name: name,
              placeDetails: placeDetails,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              score: 80 - index * 3 // Slight penalty for later results
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
    const url = `https://photon.komoot.io/api/?q=${encodedQuery}&limit=5&lang=${language === 'zh' ? 'zh' : 'en'}`;
    
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
            
            // Calculate match score to only add relevant matches
            const score = getMatchScore(name, lowercaseQuery);
            
            if (score > 50 && !allResults.some(r => 
                Math.abs(r.latitude - latitude) < 0.01 && 
                Math.abs(r.longitude - longitude) < 0.01
            )) {
              allResults.push({
                name: name,
                placeDetails: placeDetails || `Location: ${name}`,
                latitude: latitude,
                longitude: longitude,
                score: 75 - index * 3 // Slight penalty for later results
              });
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('Error querying Photon API:', error);
  }
  
  // If no results found, create a placeholder (but only if we have some text)
  if (allResults.length === 0 && query.trim().length > 0) {
    allResults.push({
      name: query,
      placeDetails: `Search result for: ${query}`,
      latitude: 30 + Math.random() * 20,
      longitude: 100 + Math.random() * 20,
      score: 10
    });
  }
  
  // Final processing - ensure language consistency in results
  const finalResults = allResults
    .sort((a, b) => b.score - a.score)
    .slice(0, 10) // Limit to 10 results to avoid overwhelming the user
    .map(({ name, latitude, longitude, placeDetails, score }) => {
      // Process result based on language
      if (language === 'zh') {
        // For Chinese, prefer results with Chinese characters
        const hasChinese = /[\u4e00-\u9fa5]/.test(name) || (placeDetails && /[\u4e00-\u9fa5]/.test(placeDetails));
        if (!hasChinese) {
          // Try to find a Chinese alternative
          const chineseAlt = Object.values(chineseCityAlternatives).find(city => 
            city.name.toLowerCase() === name.toLowerCase()
          );
          if (chineseAlt) {
            return {
              name: chineseAlt.chinese,
              placeDetails: placeDetails || chineseAlt.placeDetails,
              latitude,
              longitude
            };
          }
        }
      } else {
        // For English, prefer results without Chinese characters
        const chineseNameRatio = (name.match(/[\u4e00-\u9fa5]/g) || []).length / name.length;
        if (chineseNameRatio > 0.5) {
          // Try to find an English alternative
          const englishAlt = Object.values(chineseCityAlternatives).find(city => 
            city.chinese === name
          );
          if (englishAlt) {
            return {
              name: englishAlt.name,
              placeDetails: placeDetails || englishAlt.placeDetails,
              latitude,
              longitude
            };
          }
        }
      }
      
      return { name, latitude, longitude, placeDetails };
    });
    
  return finalResults;
}

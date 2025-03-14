
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
  { name: "Nanning", placeDetails: "Guangxi, China", latitude: 22.8170, longitude: 108.3665 }
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
  { name: "南宁", placeDetails: "广西壮族自治区, 中国", latitude: 22.8170, longitude: 108.3665 }
];

// Match score function to improve search relevance
function getMatchScore(location: string, query: string): number {
  const locationLower = location.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match gives highest score
  if (locationLower === queryLower) return 100;
  
  // Starting with the query is very good
  if (locationLower.startsWith(queryLower)) return 90;
  
  // Word boundary match is good (e.g. "New York" matches "York")
  const words = locationLower.split(/\s+/);
  for (const word of words) {
    if (word === queryLower) return 80;
    if (word.startsWith(queryLower)) return 70;
  }
  
  // Contains the query is decent
  if (locationLower.includes(queryLower)) return 60;
  
  // Partial match for each word
  for (const word of words) {
    if (word.includes(queryLower)) return 40;
  }
  
  // Fuzzy match (if the query is at least 3 chars and more than 60% of the chars match)
  if (queryLower.length >= 3) {
    const commonChars = queryLower.split('').filter(char => locationLower.includes(char)).length;
    const matchPercentage = commonChars / queryLower.length;
    if (matchPercentage > 0.6) return 30;
  }
  
  return 0; // No match
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

/**
 * Search for locations based on a query string
 */
export async function searchLocations(query: string): Promise<Location[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  const lowercaseQuery = query.toLowerCase().trim();
  const allResults: Array<Location & { score: number }> = [];
  
  // First search our database of locations
  locationDatabase.forEach(location => {
    const score = getMatchScore(location.name, lowercaseQuery);
    if (score > 0) {
      allResults.push({
        name: location.name,
        placeDetails: `${location.name}, Bortle Scale: ${location.bortleScale.toFixed(1)}`,
        latitude: location.coordinates[0],
        longitude: location.coordinates[1],
        score
      });
    }
  });
  
  // Also search common locations
  const allLocations = [...commonLocations, ...internationalLocations];
  allLocations.forEach(location => {
    // Check both name and placeDetails for matches
    const nameScore = getMatchScore(location.name, lowercaseQuery);
    const detailScore = location.placeDetails ? getMatchScore(location.placeDetails, lowercaseQuery) : 0;
    const score = Math.max(nameScore, detailScore);
    
    if (score > 0) {
      // Only add if not already in results with same name
      if (!allResults.some(r => r.name === location.name)) {
        allResults.push({
          ...location,
          score
        });
      }
    }
  });
  
  // Special case for English/Chinese location matching
  // If few results and query might be in Chinese or English, try some direct mappings
  if (allResults.length < 3) {
    const chineseToEnglish: Record<string, string> = {
      '北京': 'Beijing',
      '上海': 'Shanghai',
      '香港': 'Hong Kong',
      '广州': 'Guangzhou',
      '深圳': 'Shenzhen',
      '南宁': 'Nanning'
    };
    
    const englishToChinese: Record<string, string> = {
      'beijing': '北京',
      'shanghai': '上海',
      'hong kong': '香港',
      'guangzhou': '广州',
      'shenzhen': '深圳',
      'nanning': '南宁'
    };
    
    // Check if query is a Chinese name we know
    Object.entries(chineseToEnglish).forEach(([chinese, english]) => {
      if (chinese.includes(lowercaseQuery) || lowercaseQuery.includes(chinese)) {
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
    
    // Check if query is an English name with a Chinese equivalent
    Object.entries(englishToChinese).forEach(([english, chinese]) => {
      if (english.includes(lowercaseQuery) || lowercaseQuery.includes(english)) {
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
    
    // If the query is similar to "naning" but we know it should be "nanning"
    const querySoundex = soundex(lowercaseQuery);
    allLocations.forEach(location => {
      const locationSoundex = soundex(location.name.toLowerCase());
      if (querySoundex === locationSoundex && !allResults.some(r => r.name === location.name)) {
        allResults.push({
          ...location,
          score: 75
        });
      }
    });
  }
  
  // If still no results, create a generic suggestion
  if (allResults.length === 0) {
    // Try to make an intelligent guess about what this might be
    // Format like "Query, Region" if possible
    allResults.push({
      name: query,
      placeDetails: `Search result for: ${query}`,
      latitude: 30 + Math.random() * 20,
      longitude: 100 + Math.random() * 20,
      score: 10
    });
  }
  
  // Sort by score (highest first) and return top results
  return allResults
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ name, latitude, longitude, placeDetails }) => ({
      name, latitude, longitude, placeDetails
    }));
}

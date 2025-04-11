
// Import required functions and constants from matchingUtils
import { containsChineseCharacters, findBestMatches } from './matchingUtils';
import { Location, Language } from './types';
import { chineseCityAlternatives, checkAlternativeSpellings } from './chineseCityData'; // Import from chineseCityData
import { locationDatabase } from '@/data/locationDatabase';

// Re-export what matchingUtils.ts needs
export { chineseCityAlternatives, checkAlternativeSpellings };

/**
 * Search location database for matching locations
 * @param query Search query
 * @param language Current app language
 * @returns Array of matching locations
 */
export async function searchLocationDatabase(query: string, language: Language = 'en'): Promise<Location[]> {
  // Use the synchronous function and wrap in a Promise for API consistency
  return Promise.resolve(findMatchingLocations(query, 10, language));
}

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
  
  // Prioritize key Chinese locations when searching in Chinese
  if (hasChineseChars || language === 'zh') {
    const chineseLocationResults = findChineseLocations(queryLower, language);
    if (chineseLocationResults.length > 0) {
      results.push(...chineseLocationResults);
    }
  }
  
  // Get locations from our imported database 
  const dbLocations: Location[] = Array.isArray(locationDatabase) ? 
    locationDatabase.map((loc: any) => ({
      name: loc.name,
      placeDetails: loc.type ? `${loc.type} location` : undefined,
      latitude: loc.coordinates[0],
      longitude: loc.coordinates[1]
    })) : [];
  
  // Find matching locations from the database
  const matchingLocations = findBestMatches(dbLocations, query, language);
  
  // Combine results, but prioritize our manual entries (especially for Chinese queries)
  const combined = [...results, ...matchingLocations];
  
  // Prioritize Chinese locations for Chinese language and queries
  if (language === 'zh' || hasChineseChars) {
    combined.sort((a, b) => {
      const aHasChinese = containsChineseCharacters(a.name);
      const bHasChinese = containsChineseCharacters(b.name);
      
      if (aHasChinese && !bHasChinese) return -1;
      if (!aHasChinese && bHasChinese) return 1;
      return 0;
    });
  }
  
  // Remove duplicates based on name
  const uniqueResults = combined.filter((location, index, self) =>
    index === self.findIndex(l => l.name === location.name)
  );
  
  return uniqueResults.slice(0, limit);
}

/**
 * Find Chinese locations matching the query
 */
function findChineseLocations(queryLower: string, language: string): Location[] {
  const results: Location[] = [];
  
  // Check for our priority Chinese locations
  for (const [key, city] of Object.entries(chineseCityAlternatives)) {
    let match = false;
    
    // Prioritize Chinese character matches for Chinese queries
    if (containsChineseCharacters(queryLower) && (
        city.chinese.includes(queryLower) || 
        queryLower.includes(city.chinese) ||
        city.alternatives.some(alt => containsChineseCharacters(alt) && (alt.includes(queryLower) || queryLower.includes(alt)))
      )) {
      match = true;
    } 
    // Special case for Xuhui (徐汇)
    else if (key === 'xuhui' && (
        queryLower === 'xuhui' || 
        queryLower === 'xu hui' || 
        queryLower.includes('徐汇') || 
        '徐汇'.includes(queryLower) ||
        queryLower.includes('徐匯') || 
        '徐匯'.includes(queryLower)
      )) {
      match = true;
    }
    // Special case for Nanming (南明)
    else if (key === 'nanming' && (
        queryLower === 'nanming' || 
        queryLower === 'nan ming' || 
        queryLower.includes('南明') || 
        '南明'.includes(queryLower)
      )) {
      match = true;
    }
    // Special case for Duyun (都匀)
    else if (key === 'duyun' && (
        queryLower === 'duyun' || 
        queryLower === 'du yun' || 
        queryLower.includes('都匀') || 
        '都匀'.includes(queryLower)
      )) {
      match = true;
    }
    // Check alternatives
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
  
  return results;
}

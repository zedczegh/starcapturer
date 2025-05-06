
import { Location } from '../types';
import { containsChineseCharacters } from '@/utils/chineseCharacterConverter';
import { chineseCityAlternatives } from '../chineseCityData';
import { convertToSimplifiedChinese } from '@/utils/chineseCharacterConverter';

/**
 * Search specifically for Chinese regions using specialized data
 * @param query Search query text
 * @returns Array of matching Chinese locations
 */
export async function searchChineseRegions(query: string): Promise<Location[]> {
  const results: Location[] = [];
  const originalQuery = query.toLowerCase().trim();
  
  // Convert query to simplified Chinese if it contains Chinese characters
  const queryLower = containsChineseCharacters(originalQuery) ? 
    convertToSimplifiedChinese(originalQuery).toLowerCase() : originalQuery;
  
  // Skip non-Chinese character queries for efficiency
  if (!containsChineseCharacters(queryLower) && !queryRequiresChinaSearch(queryLower)) {
    return results;
  }
  
  // Look up direct matches in our Chinese city database
  for (const [key, city] of Object.entries(chineseCityAlternatives)) {
    // Convert city.chinese to simplified Chinese
    const simplifiedCityName = convertToSimplifiedChinese(city.chinese);
    
    if (simplifiedCityName.includes(queryLower) || 
        queryLower.includes(simplifiedCityName) || 
        key.includes(queryLower) || 
        queryLower.includes(key) ||
        city.alternatives.some(alt => alt.includes(queryLower) || queryLower.includes(alt))) {
      
      results.push({
        name: simplifiedCityName, // Use simplified Chinese name for Chinese region searches
        latitude: city.coordinates[0],
        longitude: city.coordinates[1],
        placeDetails: convertToSimplifiedChinese(city.placeDetails) || '中国城市'
      });
    }
  }
  
  return results;
}

/**
 * Helper function to determine if a query might be looking for a Chinese city
 * even if it doesn't contain Chinese characters
 */
function queryRequiresChinaSearch(query: string): boolean {
  // Check for common terms that might indicate a search for Chinese locations
  const chinaTerms = ['china', 'chinese', 'beijing', 'shanghai', 'guangzhou', 
                     'shenzhen', 'chengdu', 'xian', "xi'an", 'hangzhou', 
                     'nanjing', 'suzhou', 'chongqing', 'tianjin', 'wuhan'];
  
  return chinaTerms.some(term => query.includes(term));
}

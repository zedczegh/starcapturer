
import { Location, Language } from '../types';
import { containsChineseCharacters } from '../matching';
import { checkAlternativeSpellings } from '../chineseCityData';
import { findMatchingLocations } from '../locationDatabase';

/**
 * Specialized search function for Chinese regions
 * Optimized to handle Chinese characters and alternative spellings
 */
export async function searchChineseRegions(
  query: string,
  language: Language
): Promise<Location[]> {
  // Return empty results for empty queries
  if (!query || !query.trim()) return [];

  const hasChineseChars = containsChineseCharacters(query);
  const results: Location[] = [];
  
  // Method 1: Check for alternative spellings in our database
  const alternativeResults = checkAlternativeSpellings(query);
  if (alternativeResults.length > 0) {
    results.push(...alternativeResults);
  }
  
  // Method 2: Find matching locations from our database
  const databaseResults = findMatchingLocations(query, 5, language);
  
  // Combine results and prioritize Chinese matches if this is a Chinese query
  const combinedResults = [...results, ...databaseResults];

  // Remove duplicates and prioritize Chinese matches
  const uniqueMap = new Map<string, Location>();
  
  for (const location of combinedResults) {
    const key = `${location.latitude.toFixed(4)}_${location.longitude.toFixed(4)}`;
    
    // If we already have this location, only replace it if the new one has Chinese chars and old one doesn't
    if (uniqueMap.has(key)) {
      const existing = uniqueMap.get(key)!;
      const newHasChinese = containsChineseCharacters(location.name);
      const existingHasChinese = containsChineseCharacters(existing.name);
      
      if (newHasChinese && !existingHasChinese) {
        uniqueMap.set(key, location);
      }
    } else {
      uniqueMap.set(key, location);
    }
  }
  
  const uniqueResults = Array.from(uniqueMap.values());
  
  // Sort results by relevance: Chinese characters first when appropriate
  return uniqueResults.sort((a, b) => {
    if (hasChineseChars || language === 'zh') {
      // Prioritize results with Chinese characters for Chinese queries
      const aHasChinese = containsChineseCharacters(a.name);
      const bHasChinese = containsChineseCharacters(b.name);
      
      if (aHasChinese && !bHasChinese) return -1;
      if (!aHasChinese && bHasChinese) return 1;
    }
    return 0;
  });
}

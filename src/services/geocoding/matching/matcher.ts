import { Location } from '../types';
import { getMatchScore } from './scoreCalculator';

/**
 * Find the best matching locations based on search query
 * @param locations List of locations to search through
 * @param query User search query
 * @param language Language for matching prioritization
 * @returns Filtered and sorted list of locations
 */
export function findBestMatches(locations: Location[], query: string, language: string = 'en'): Location[] {
  if (!locations || locations.length === 0) return [];
  
  // Import here to avoid circular dependencies
  import { containsChineseCharacters } from './pinyinUtils';
  const hasChineseQuery = containsChineseCharacters(query);
  
  // Calculate match scores for all locations
  const scoredLocations = locations.map(location => {
    // Pass language to getMatchScore for language-specific optimizations
    const score = getMatchScore(location.name, query, language);
    return { location, score };
  });
  
  // Apply language-specific filtering
  let filteredLocations = scoredLocations;
  
  // In Chinese mode with Chinese query, heavily prioritize Chinese results
  if (language === 'zh' && hasChineseQuery) {
    // First try to find locations with Chinese characters
    const chineseLocations = filteredLocations.filter(
      item => containsChineseCharacters(item.location.name) && item.score >= 50
    );
    
    // If we have good Chinese matches, use only those
    if (chineseLocations.length > 0) {
      filteredLocations = chineseLocations;
    } else {
      // Otherwise, just filter very low scores
      filteredLocations = filteredLocations.filter(item => item.score >= 40);
    }
  } else {
    // For other languages, use a lower threshold
    filteredLocations = filteredLocations.filter(item => item.score >= 20);
  }
  
  // Sort by match score (highest first)
  const sortedLocations = filteredLocations.sort((a, b) => b.score - a.score);
  
  // Extract just the location objects for the final result
  return sortedLocations.map(item => item.location);
}

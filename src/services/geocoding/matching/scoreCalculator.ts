
import { containsChineseCharacters } from './pinyinUtils';
import { getLanguageMatchScore, calculateCharacterMatchScore } from './languageMatching';
import { calculateWordMatchScore, getPriorityAdjustment } from './wordMatching';

/**
 * Enhanced match score function with improved language support
 * and prioritization of known locations in our database
 */
export function getMatchScore(location: string, query: string, language: string = 'en'): number {
  const locationLower = location.toLowerCase();
  const queryLower = query.toLowerCase().trim();
  
  // Check for special priority cases
  const priorityScore = getPriorityAdjustment(locationLower, queryLower);
  if (priorityScore > 0) {
    return priorityScore;
  }
  
  // Detect if query contains Chinese characters
  const hasChineseQuery = containsChineseCharacters(queryLower);
  const hasChineseLocation = containsChineseCharacters(locationLower);
  
  // Language-specific boosting - prioritize matches that align with the current language
  const languageBoost = getLanguageMatchScore(
    locationLower, queryLower, language, hasChineseQuery, hasChineseLocation
  );
  
  // Perfect match - highest priority after special cases
  if (locationLower === queryLower) return 100 + (languageBoost > 0 ? languageBoost : 0);
  
  // Prefix match still gets high priority for non-Chinese queries
  if (locationLower.startsWith(queryLower)) return 98 + (languageBoost > 0 ? languageBoost : 0);

  // Split the query and location into words for better matching
  const queryWords = queryLower.split(/\s+/);
  const locationWords = locationLower.split(/\s+/);
  
  // Highly prioritize exact substring match (e.g. "cali" in "california")
  if (locationLower.includes(queryLower)) return 95 + (languageBoost > 0 ? languageBoost : 0);
  
  // Check for word matches
  const wordMatchScore = calculateWordMatchScore(
    queryWords, locationWords, queryLower, locationLower, hasChineseQuery, languageBoost
  );
  
  if (wordMatchScore > 0) {
    return wordMatchScore;
  }
  
  // Check for character-level matches as last resort
  return calculateCharacterMatchScore(queryLower, locationLower, hasChineseQuery, languageBoost);
}

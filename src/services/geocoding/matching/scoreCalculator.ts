
import { containsChineseCharacters } from './pinyinUtils';

/**
 * Enhanced match score function with improved language support
 * and prioritization of known locations in our database
 */
export function getMatchScore(location: string, query: string, language: string = 'en'): number {
  const locationLower = location.toLowerCase();
  const queryLower = query.toLowerCase().trim();
  
  // Special case for Beijing to ensure consistent results
  if ((queryLower === 'beijing' || queryLower === '北京') && 
      (locationLower === 'beijing' || locationLower === '北京')) {
    return 105; // Extra high score to ensure it's always prioritized
  }
  
  // Detect if query contains Chinese characters
  const hasChineseQuery = containsChineseCharacters(queryLower);
  const hasChineseLocation = containsChineseCharacters(locationLower);
  
  // Language-specific boosting - prioritize matches that align with the current language
  const languageMatch = language === 'zh' && (hasChineseQuery || hasChineseLocation);
  const languageBoost = languageMatch ? 20 : 0; // Increased boost for Chinese matches
  
  // Perfect match
  if (locationLower === queryLower) return 100 + languageBoost;
  
  // For Chinese queries, give strong preference to locations with Chinese characters
  if (hasChineseQuery && hasChineseLocation) {
    // Direct Chinese character matching - increased scores for better prioritization
    const commonChars = queryLower.split('').filter(char => locationLower.includes(char)).length;
    const matchPercentage = commonChars / queryLower.length;
    
    if (matchPercentage === 1) return 99 + languageBoost; // All characters match
    if (matchPercentage >= 0.8) return 97 + languageBoost; // Increased from 95
    if (matchPercentage >= 0.6) return 95 + languageBoost; // Increased from 90
    if (matchPercentage >= 0.4) return 93 + languageBoost; // Increased from 85
    if (matchPercentage >= 0.2) return 90 + languageBoost; // Increased from 80
    
    // Even a single character match gets a good score for Chinese
    if (matchPercentage > 0) return 85 + languageBoost;
  }
  
  // Strong boost for Chinese character matches when in Chinese language mode
  if (language === 'zh' && hasChineseQuery) {
    // If query has Chinese but location doesn't, this is likely a poor match
    if (!hasChineseLocation) return 10; // Very low score for non-Chinese locations
  }
  
  // Prefix match still gets high priority for non-Chinese queries
  if (locationLower.startsWith(queryLower)) return 98 + languageBoost;

  // Split the query and location into words for better matching
  const queryWords = queryLower.split(/\s+/);
  const locationWords = locationLower.split(/\s+/);
  
  // Highly prioritize exact substring match (e.g. "cali" in "california")
  if (locationLower.includes(queryLower)) return 95 + languageBoost;
  
  // Check for word matches
  return calculateWordMatchScore(queryWords, locationWords, queryLower, locationLower, hasChineseQuery, languageBoost);
}

/**
 * Helper function to calculate match scores based on word matching
 */
function calculateWordMatchScore(
  queryWords: string[], 
  locationWords: string[],
  queryLower: string,
  locationLower: string,
  hasChineseQuery: boolean,
  languageBoost: number
): number {
  // Check if any location word starts with the query
  for (const word of locationWords) {
    if (word.startsWith(queryLower)) return 92 + languageBoost;
  }
  
  // If this is a multi-word search
  if (queryWords.length > 1) {
    // Check if all query words are present in the location (regardless of order)
    const allWordsPresent = queryWords.every(word => locationLower.includes(word));
    if (allWordsPresent) return 90 + languageBoost;
    
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
      return 85 + matchingWords + languageBoost;
    }
    
    // Check exact match for any individual word in the query against any word in the location
    for (const queryWord of queryWords) {
      for (const locationWord of locationWords) {
        if (locationWord === queryWord) {
          return 84 + languageBoost;
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
      return 80 + ((matchingWordCount / queryWords.length) * 3) + languageBoost;
    }
  }
  
  // Exact word match
  for (const word of locationWords) {
    if (word === queryLower) return 80 + languageBoost;
  }
  
  // Word contains query
  for (const word of locationWords) {
    if (word.includes(queryLower)) return 75 + languageBoost;
  }
  
  return calculateCharacterMatchScore(queryLower, locationLower, hasChineseQuery, languageBoost);
}

/**
 * Helper function to calculate character-based match scores
 */
function calculateCharacterMatchScore(
  queryLower: string,
  locationLower: string,
  hasChineseQuery: boolean,
  languageBoost: number
): number {
  // Partial word matching
  if (queryLower.length >= 2) {
    for (const word of locationLower.split(/\s+/)) {
      if (word.startsWith(queryLower.substring(0, Math.min(word.length, queryLower.length)))) {
        const matchLength = Math.min(queryLower.length, word.length);
        const matchPercentage = matchLength / word.length;
        return 60 + (matchPercentage * 15) + languageBoost; 
      }
    }
  }
  
  // First letter matches beginning of a word
  if (queryLower.length === 1) {
    for (const word of locationLower.split(/\s+/)) {
      if (word.startsWith(queryLower)) {
        return 40 + languageBoost;
      }
    }
  }
  
  // Special handling for Chinese characters
  if (queryLower.length >= 1 && hasChineseQuery) { 
    const commonChars = queryLower.split('').filter(char => locationLower.includes(char)).length;
    const matchPercentage = commonChars / queryLower.length;
    if (matchPercentage > 0.5) return 70 + languageBoost; // Increased from 50
    if (matchPercentage > 0.3) return 60 + languageBoost; // Increased from 40
    if (matchPercentage > 0) return 50 + languageBoost;   // Handle any match
  } else if (queryLower.length >= 1) { 
    const commonChars = queryLower.split('').filter(char => locationLower.includes(char)).length;
    const matchPercentage = commonChars / queryLower.length;
    if (matchPercentage > 0.7) return 35;
    if (matchPercentage > 0.5) return 30;
  }
  
  return 0;
}


/**
 * Calculate match scores based on word matching
 */
export function calculateWordMatchScore(
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
  
  return 0;
}

/**
 * Get priority score adjustment for special cases
 */
export function getPriorityAdjustment(
  locationLower: string, 
  queryLower: string
): number {
  // Special case for Beijing to ensure consistent results
  if ((queryLower === 'beijing' || queryLower === '北京') && 
      (locationLower === 'beijing' || locationLower === '北京')) {
    return 105; // Extra high score to ensure it's always prioritized
  }
  
  return 0;
}

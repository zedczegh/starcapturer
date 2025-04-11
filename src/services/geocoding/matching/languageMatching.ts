
import { containsChineseCharacters } from './pinyinUtils';

/**
 * Calculate match scores based on language-specific features
 */
export function getLanguageMatchScore(
  location: string, 
  query: string,
  languageCode: string = 'en', 
  hasChineseQuery: boolean,
  hasChineseLocation: boolean
): number {
  // Language-specific boosting - prioritize matches that align with the current language
  const languageMatch = languageCode === 'zh' && (hasChineseQuery || hasChineseLocation);
  const languageBoost = languageMatch ? 20 : 0; // Increased boost for Chinese matches
  
  // For Chinese queries, give strong preference to locations with Chinese characters
  if (hasChineseQuery && hasChineseLocation) {
    // Direct Chinese character matching - increased scores for better prioritization
    const commonChars = query.split('').filter(char => location.includes(char)).length;
    const matchPercentage = commonChars / query.length;
    
    if (matchPercentage === 1) return 99 + languageBoost; // All characters match
    if (matchPercentage >= 0.8) return 97 + languageBoost; // Increased from 95
    if (matchPercentage >= 0.6) return 95 + languageBoost; // Increased from 90
    if (matchPercentage >= 0.4) return 93 + languageBoost; // Increased from 85
    if (matchPercentage >= 0.2) return 90 + languageBoost; // Increased from 80
    
    // Even a single character match gets a good score for Chinese
    if (matchPercentage > 0) return 85 + languageBoost;
  }
  
  // Strong boost for Chinese character matches when in Chinese language mode
  if (languageCode === 'zh' && hasChineseQuery) {
    // If query has Chinese but location doesn't, this is likely a poor match
    if (!hasChineseLocation) return 10; // Very low score for non-Chinese locations
  }
  
  return languageBoost;
}

/**
 * Calculate character-based match scores
 */
export function calculateCharacterMatchScore(
  query: string,
  location: string,
  hasChineseQuery: boolean,
  languageBoost: number
): number {
  // Partial word matching
  if (query.length >= 2) {
    for (const word of location.split(/\s+/)) {
      if (word.startsWith(query.substring(0, Math.min(word.length, query.length)))) {
        const matchLength = Math.min(query.length, word.length);
        const matchPercentage = matchLength / word.length;
        return 60 + (matchPercentage * 15) + languageBoost; 
      }
    }
  }
  
  // First letter matches beginning of a word
  if (query.length === 1) {
    for (const word of location.split(/\s+/)) {
      if (word.startsWith(query)) {
        return 40 + languageBoost;
      }
    }
  }
  
  // Special handling for Chinese characters
  if (query.length >= 1 && hasChineseQuery) { 
    const commonChars = query.split('').filter(char => location.includes(char)).length;
    const matchPercentage = commonChars / query.length;
    if (matchPercentage > 0.5) return 70 + languageBoost; // Increased from 50
    if (matchPercentage > 0.3) return 60 + languageBoost; // Increased from 40
    if (matchPercentage > 0) return 50 + languageBoost;   // Handle any match
  } else if (query.length >= 1) { 
    const commonChars = query.split('').filter(char => location.includes(char)).length;
    const matchPercentage = commonChars / query.length;
    if (matchPercentage > 0.7) return 35;
    if (matchPercentage > 0.5) return 30;
  }
  
  return 0;
}

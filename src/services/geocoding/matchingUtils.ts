import { Location } from './types';
import { chineseCityAlternatives } from './locationDatabase';

// Chinese pinyin-specific matching
// Map common pinyin syllables to possible variations when typing quickly
export const pinyinVariations: Record<string, string[]> = {
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
export function generatePinyinVariations(input: string): string[] {
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

// Check if string contains Chinese characters
export function containsChineseCharacters(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

// Enhanced match score function with improved Chinese characters support
export function getMatchScore(location: string, query: string, language: string = 'en'): number {
  const locationLower = location.toLowerCase();
  const queryLower = query.toLowerCase().trim();
  
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
  
  // Partial word matching
  if (queryLower.length >= 2) {
    for (const word of locationWords) {
      if (word.startsWith(queryLower.substring(0, Math.min(word.length, queryLower.length)))) {
        const matchLength = Math.min(queryLower.length, word.length);
        const matchPercentage = matchLength / word.length;
        return 60 + (matchPercentage * 15) + languageBoost; 
      }
    }
  }
  
  // First letter matches beginning of a word
  if (queryLower.length === 1) {
    for (const word of locationWords) {
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

/**
 * Find the best matching locations based on search query
 * @param locations List of locations to search through
 * @param query User search query
 * @param language Language for matching prioritization
 * @returns Filtered and sorted list of locations
 */
export function findBestMatches(locations: Location[], query: string, language: string = 'en'): Location[] {
  if (!locations || locations.length === 0) return [];
  
  // Check if query has Chinese characters
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

// Soundex implementation for phonetic matching
export function soundex(s: string): string {
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
export function checkAlternativeSpellings(query: string): Location[] {
  const results: Location[] = [];
  const queryLower = query.toLowerCase().trim();
  
  // Special case handling for specific Chinese locations
  if (queryLower.includes('徐汇') || queryLower.includes('xu hui') || queryLower === 'xuhui') {
    const city = chineseCityAlternatives['xuhui'];
    results.push({ 
      name: city.name, 
      placeDetails: city.placeDetails, 
      latitude: city.coordinates[0], 
      longitude: city.coordinates[1] 
    });
    return results; // Return immediately for this special case
  }
  
  if (queryLower.includes('南明') || queryLower.includes('nan ming') || queryLower === 'nanming') {
    const city = chineseCityAlternatives['nanming'];
    results.push({ 
      name: city.name, 
      placeDetails: city.placeDetails, 
      latitude: city.coordinates[0], 
      longitude: city.coordinates[1] 
    });
    return results; // Return immediately for this special case
  }
  
  if (queryLower.includes('都匀') || queryLower.includes('du yun') || queryLower === 'duyun') {
    const city = chineseCityAlternatives['duyun'];
    results.push({ 
      name: city.name, 
      placeDetails: city.placeDetails, 
      latitude: city.coordinates[0], 
      longitude: city.coordinates[1] 
    });
    return results; // Return immediately for this special case
  }
  
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

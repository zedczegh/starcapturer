
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

// Enhanced match score function with multi-word search support
export function getMatchScore(location: string, query: string): number {
  const locationLower = location.toLowerCase();
  const queryLower = query.toLowerCase().trim();
  
  // Perfect match
  if (locationLower === queryLower) return 100;
  
  // Prefix match gets high priority (e.g. "cali" matching "california")
  if (locationLower.startsWith(queryLower)) return 98;

  // Split the query and location into words for better matching
  const queryWords = queryLower.split(/\s+/);
  const locationWords = locationLower.split(/\s+/);
  
  // Highly prioritize exact substring match (e.g. "cali" in "california")
  if (locationLower.includes(queryLower)) return 95;
  
  // Check if any location word starts with the query
  for (const word of locationWords) {
    if (word.startsWith(queryLower)) return 92;
  }
  
  // If this is a multi-word search
  if (queryWords.length > 1) {
    // Check if all query words are present in the location (regardless of order)
    const allWordsPresent = queryWords.every(word => locationLower.includes(word));
    if (allWordsPresent) return 90;
    
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
      return 85 + matchingWords;
    }
    
    // Check exact match for any individual word in the query against any word in the location
    for (const queryWord of queryWords) {
      for (const locationWord of locationWords) {
        if (locationWord === queryWord) {
          return 84;
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
      return 80 + ((matchingWordCount / queryWords.length) * 3);
    }
  }
  
  // Exact word match
  for (const word of locationWords) {
    if (word === queryLower) return 80;
  }
  
  // Word contains query
  for (const word of locationWords) {
    if (word.includes(queryLower)) return 75;
  }
  
  // Partial word matching
  if (queryLower.length >= 2) {
    for (const word of locationWords) {
      if (word.startsWith(queryLower.substring(0, Math.min(word.length, queryLower.length)))) {
        const matchLength = Math.min(queryLower.length, word.length);
        const matchPercentage = matchLength / word.length;
        return 60 + (matchPercentage * 15); 
      }
    }
  }
  
  // First letter matches beginning of a word
  if (queryLower.length === 1) {
    for (const word of locationWords) {
      if (word.startsWith(queryLower)) {
        return 40;
      }
    }
  }
  
  // Special handling for Chinese characters
  if (queryLower.length >= 1 && /[\u4e00-\u9fa5]/.test(queryLower)) { 
    const commonChars = queryLower.split('').filter(char => locationLower.includes(char)).length;
    const matchPercentage = commonChars / queryLower.length;
    if (matchPercentage > 0.5) return 50;
    if (matchPercentage > 0.3) return 40;
  } else if (queryLower.length >= 1) { 
    const commonChars = queryLower.split('').filter(char => locationLower.includes(char)).length;
    const matchPercentage = commonChars / queryLower.length;
    if (matchPercentage > 0.7) return 35;
    if (matchPercentage > 0.5) return 30;
  }
  
  return 0;
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

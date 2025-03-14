
import { Location, Language } from './types';
import { getMatchScore, generatePinyinVariations, soundex, checkAlternativeSpellings } from './matchingUtils';
import { commonLocations, internationalLocations, chineseCityAlternatives } from './locationDatabase';

// Define key special search terms that should have fixed behavior
const SPECIAL_SEARCH_TERMS = {
  'cal': {
    name: "California",
    placeDetails: "California, USA", 
    latitude: 36.7014631, 
    longitude: -118.755997
  },
  'cali': {
    name: "California",
    placeDetails: "California, USA", 
    latitude: 36.7014631, 
    longitude: -118.755997
  },
  'calif': {
    name: "California",
    placeDetails: "California, USA", 
    latitude: 36.7014631, 
    longitude: -118.755997
  }
};

/**
 * Search for locations based on a query string
 * Enhanced to find any location worldwide using multiple data sources
 * And improved to handle language preferences and multi-word searches
 */
export async function searchLocations(query: string, language: Language = 'en'): Promise<Location[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  const lowercaseQuery = query.toLowerCase().trim();
  
  // Handle special fixed search cases (like California)
  if (SPECIAL_SEARCH_TERMS[lowercaseQuery as keyof typeof SPECIAL_SEARCH_TERMS]) {
    return [SPECIAL_SEARCH_TERMS[lowercaseQuery as keyof typeof SPECIAL_SEARCH_TERMS]];
  }
  
  // Also check for "calif" prefix for other California searches
  if (lowercaseQuery.startsWith('califo') || lowercaseQuery.startsWith('calif ')) {
    return [SPECIAL_SEARCH_TERMS.calif];
  }
  
  const queryWords = lowercaseQuery.split(/\s+/);
  const queryVariations = generatePinyinVariations(lowercaseQuery);
  const allResults: Array<Location & { score: number }> = [];
  
  // Check against alternative spellings
  const alternativeMatches = checkAlternativeSpellings(lowercaseQuery);
  alternativeMatches.forEach(match => {
    allResults.push({
      ...match,
      score: 95
    });
  });
  
  // Import and process location database
  const { locationDatabase } = await import('@/utils/locationUtils');
  locationDatabase.forEach(location => {
    let highestScore = 0;
    
    // Try all query variations and use the highest score
    queryVariations.forEach(qVar => {
      const score = getMatchScore(location.name, qVar);
      highestScore = Math.max(highestScore, score);
    });
    
    // For multi-word queries, also check each word individually
    if (queryWords.length > 1) {
      queryWords.forEach(word => {
        if (word.length >= 2) { // Only check words with 2+ characters
          const score = getMatchScore(location.name, word) * 0.9; // Slightly lower score for partial matches
          highestScore = Math.max(highestScore, score);
        }
      });
    }
    
    if (highestScore > 0) {
      allResults.push({
        name: location.name,
        placeDetails: `${location.name}, Bortle Scale: ${location.bortleScale.toFixed(1)}`,
        latitude: location.coordinates[0],
        longitude: location.coordinates[1],
        score: highestScore
      });
    }
  });
  
  // Process standardized location database, prioritizing exact matches
  const locationList = language === 'zh' 
    ? [...internationalLocations.filter(loc => /[\u4e00-\u9fa5]/.test(loc.name)), ...commonLocations]
    : [...internationalLocations.filter(loc => !/[\u4e00-\u9fa5]/.test(loc.name)), ...commonLocations];

  locationList.forEach(location => {
    let highestScore = 0;
    
    // Try all query variations
    queryVariations.forEach(qVar => {
      // Calculate score based on name and details
      const nameScore = getMatchScore(location.name, qVar);
      const detailScore = location.placeDetails ? getMatchScore(location.placeDetails, qVar) * 0.9 : 0;
      highestScore = Math.max(highestScore, nameScore, detailScore);
    });
    
    if (highestScore > 0) {
      // Avoid duplicates
      if (!allResults.some(r => r.name === location.name)) {
        allResults.push({
          ...location,
          score: highestScore
        });
      }
    }
  });
  
  // Only add exact match translations between Chinese and English if we have few results
  if (allResults.length < 3) {
    const translatedResults: Location[] = [];
    if (language === 'en') {
      // If searching in English, look for Chinese names that match
      Object.values(chineseCityAlternatives).forEach(city => {
        if (city.chinese.toLowerCase() === lowercaseQuery) {
          translatedResults.push({
            name: city.name,
            placeDetails: city.placeDetails,
            latitude: city.coordinates[0],
            longitude: city.coordinates[1]
          });
        }
      });
    } else {
      // If searching in Chinese, look for English names that match
      Object.values(chineseCityAlternatives).forEach(city => {
        if (city.name.toLowerCase() === lowercaseQuery) {
          translatedResults.push({
            name: city.chinese,
            placeDetails: city.placeDetails,
            latitude: city.coordinates[0],
            longitude: city.coordinates[1]
          });
        }
      });
    }
    
    translatedResults.forEach(translated => {
      if (!allResults.some(r => r.name === translated.name)) {
        allResults.push({
          ...translated,
          score: 90
        });
      }
    });
  }
  
  // Add phonetic matches only if we have few results
  if (allResults.length < 3) {
    const phoneticMatches: Location[] = [];
    locationList.forEach(location => {
      const locationSoundex = soundex(location.name);
      const querySoundex = soundex(query);
      
      if (locationSoundex === querySoundex) {
        phoneticMatches.push(location);
      }
    });
    
    phoneticMatches.forEach(match => {
      if (!allResults.some(r => r.name === match.name)) {
        allResults.push({
          ...match,
          score: 70
        });
      }
    });
  }
  
  // Sort results by score (highest first)
  const sortedResults = allResults
    .sort((a, b) => b.score - a.score)
    .map(({ score, ...location }) => location); // Remove the score from the final results
  
  return sortedResults;
}

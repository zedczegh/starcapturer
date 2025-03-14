
import { Location } from '../types';
import { findSmallTownMatches } from '../smallTownsDatabase';

// Enhanced western cities database with improved search terms
const westernCities: Record<string, Location> = {
  'new york': {
    name: 'New York City, USA',
    placeDetails: 'Major city in United States',
    latitude: 40.7128,
    longitude: -74.0060
  },
  'london': {
    name: 'London, United Kingdom',
    placeDetails: 'Capital city of United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278
  },
  'paris': {
    name: 'Paris, France',
    placeDetails: 'Capital city of France',
    latitude: 48.8566,
    longitude: 2.3522
  },
  'sydney': {
    name: 'Sydney, Australia',
    placeDetails: 'Major city in Australia',
    latitude: -33.8688,
    longitude: 151.2093
  },
  'los angeles': {
    name: 'Los Angeles, USA',
    placeDetails: 'Major city in California, United States',
    latitude: 34.0522,
    longitude: -118.2437
  },
  'new castle': {
    name: 'Newcastle upon Tyne, UK',
    placeDetails: 'City in Northern England',
    latitude: 54.9783,
    longitude: -1.6178
  },
  'newcastle': {
    name: 'Newcastle upon Tyne, UK',
    placeDetails: 'City in Northern England',
    latitude: 54.9783,
    longitude: -1.6178
  },
  'california': {
    name: 'California, USA',
    placeDetails: 'State in United States',
    latitude: 36.7783,
    longitude: -119.4179
  },
  'denmark': {
    name: 'Denmark',
    placeDetails: 'Country in Northern Europe',
    latitude: 56.2639,
    longitude: 9.5018
  }
};

// Search term aliases to recognize different forms
const searchAliases: Record<string, string[]> = {
  'new castle': ['newcastle', 'newcastle upon tyne'],
  'newcastle': ['new castle', 'newcastle upon tyne'],
  'california': ['ca', 'calif', 'cali'],
  'ca': ['california', 'calif', 'cali'],
  'cali': ['california', 'ca', 'cali'],
  'calif': ['california', 'ca', 'cali'],
  'new york': ['ny', 'nyc'],
  'ny': ['new york', 'nyc'],
  'los angeles': ['la', 'los angeles ca'],
  'denmark': ['danish']
};

/**
 * Search western cities and small towns with the given query
 */
export async function searchWesternCities(query: string): Promise<Location[]> {
  // First check for small towns with famous names
  const smallTownResults = findSmallTownMatches(query, 'en');
  
  // Check exact matches for major cities
  if (westernCities[query]) {
    // If we have both a major city match and small town matches with the same name,
    // combine them with the major city first
    if (smallTownResults.length > 0) {
      return [westernCities[query], ...smallTownResults];
    }
    return [westernCities[query]];
  }
  
  // Check for alias matches
  const aliasMatch = findAliasMatch(query);
  if (aliasMatch) {
    // Combine with small town results if available
    if (smallTownResults.length > 0) {
      return [westernCities[aliasMatch], ...smallTownResults];
    }
    return [westernCities[aliasMatch]];
  }
  
  // If we have small town matches, return them now
  if (smallTownResults.length > 0) {
    return smallTownResults;
  }
  
  // Check for partial matches with western cities database
  return findPartialMatches(query);
}

/**
 * Find matching aliases for the search term
 */
export function findAliasMatch(query: string): string | null {
  // Check if this query is a direct alias
  for (const [key, aliases] of Object.entries(searchAliases)) {
    if (aliases.includes(query)) {
      return key;
    }
  }
  
  // Check if this query is a key with aliases
  if (searchAliases[query]) {
    return query;
  }
  
  return null;
}

/**
 * Find partial matches within the western cities database
 */
export function findPartialMatches(query: string): Location[] {
  const results: Location[] = [];
  const words = query.split(' ');
  
  // Check for matches with parts of city names
  for (const [key, city] of Object.entries(westernCities)) {
    // Direct substring match
    if (key.includes(query) || query.includes(key)) {
      results.push(city);
      continue;
    }
    
    // Word-level matching
    const keyWords = key.split(' ');
    const hasWordMatch = words.some(word => 
      keyWords.some(keyWord => 
        keyWord.includes(word) || word.includes(keyWord)
      )
    );
    
    if (hasWordMatch) {
      results.push(city);
    }
  }
  
  // Also check small town matches
  const smallTownMatches = findSmallTownMatches(query);
  
  // Combine results, prioritizing major cities
  return [...results, ...smallTownMatches];
}

/**
 * Get direct access to the western cities database
 */
export function getWesternCitiesDatabase(): Record<string, Location> {
  return { ...westernCities };
}


import { Location } from './types';

/**
 * Find matches for small towns that might not be in the main database
 * Enhanced with more small towns and improved matching
 * @param query Search query
 * @returns Array of matching small town locations
 */
export function findSmallTownMatches(query: string): Location[] {
  // This is a stub implementation for now
  // In the future, this should contain a database of small towns
  // that are not included in the main database
  
  const queryLower = query.trim().toLowerCase();
  
  // Basic small towns database for exact matches only
  const smallTowns: Record<string, Location> = {
    // US small towns
    "bishop": {
      name: "Bishop, California, USA",
      latitude: 37.3614,
      longitude: -118.3997
    },
    "moab": {
      name: "Moab, Utah, USA",
      latitude: 38.5733,
      longitude: -109.5498
    },
    "sedona": {
      name: "Sedona, Arizona, USA",
      latitude: 34.8697,
      longitude: -111.7601
    },
    "taos": {
      name: "Taos, New Mexico, USA",
      latitude: 36.4072,
      longitude: -105.5731
    },
    // Dark Sky Locations - Additional accurate data
    "flagstaff": {
      name: "Flagstaff Dark Sky City, Arizona, USA",
      latitude: 35.1983,
      longitude: -111.6513,
      placeDetails: "World's First International Dark Sky City"
    },
    "borrego springs": {
      name: "Borrego Springs Dark Sky Community, California, USA",
      latitude: 33.2558,
      longitude: -116.3753,
      placeDetails: "Dark Sky Community - International Dark Sky Association"
    },
    "westcliffe": {
      name: "Westcliffe Dark Sky Community, Colorado, USA",
      latitude: 38.1350,
      longitude: -105.4661,
      placeDetails: "Dark Sky Community - International Dark Sky Association"
    },
    "headlands": {
      name: "Headlands International Dark Sky Park, Michigan, USA",
      latitude: 45.7808,
      longitude: -84.9080,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "grand canyon": {
      name: "Grand Canyon National Park Dark Sky Park, Arizona, USA",
      latitude: 36.0570,
      longitude: -112.1391,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "big bend": {
      name: "Big Bend National Park Dark Sky Park, Texas, USA",
      latitude: 29.2498,
      longitude: -103.2502,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "clayton lake": {
      name: "Clayton Lake State Park Dark Sky Park, New Mexico, USA",
      latitude: 36.5841,
      longitude: -103.3163,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    "copper breaks": {
      name: "Copper Breaks State Park Dark Sky Park, Texas, USA",
      latitude: 34.1075,
      longitude: -99.7481,
      placeDetails: "Dark Sky Park - International Dark Sky Association"
    },
    // Add more small towns as needed
  };
  
  // Check for exact matches
  if (smallTowns[queryLower]) {
    return [smallTowns[queryLower]];
  }
  
  // Check for partial matches with improved algorithm
  const partialMatches: Location[] = [];
  Object.keys(smallTowns).forEach(townName => {
    // Check if query is contained within town name or town name is contained within query
    if (townName.includes(queryLower) || queryLower.includes(townName)) {
      partialMatches.push(smallTowns[townName]);
    } 
    // Check for word matches (e.g. "dark sky" in "flagstaff dark sky")
    else if (queryLower.split(' ').some(word => 
      word.length > 2 && townName.includes(word)) || 
      townName.split(' ').some(word => 
        word.length > 2 && queryLower.includes(word))) {
      partialMatches.push(smallTowns[townName]);
    }
  });
  
  // If query contains "dark sky", "dark-sky", or "ida", include all dark sky locations
  if (queryLower.includes('dark sky') || 
      queryLower.includes('dark-sky') || 
      queryLower.includes('ida')) {
    // Find all dark sky locations
    Object.values(smallTowns).forEach(town => {
      if ((town.name && 
          (town.name.toLowerCase().includes('dark sky') || 
           town.name.toLowerCase().includes('dark-sky'))) ||
          (town.placeDetails && 
           town.placeDetails.toLowerCase().includes('dark sky'))) {
        // Avoid duplicates
        if (!partialMatches.some(match => match.name === town.name)) {
          partialMatches.push(town);
        }
      }
    });
  }
  
  return partialMatches;
}


import { Location } from './types';

/**
 * Find matches for small towns that might not be in the main database
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
    
    // Add more small towns as needed
  };
  
  // Check for exact matches
  if (smallTowns[queryLower]) {
    return [smallTowns[queryLower]];
  }
  
  // Check for partial matches
  const partialMatches: Location[] = [];
  Object.keys(smallTowns).forEach(townName => {
    if (townName.includes(queryLower) || queryLower.includes(townName)) {
      partialMatches.push(smallTowns[townName]);
    }
  });
  
  return partialMatches;
}

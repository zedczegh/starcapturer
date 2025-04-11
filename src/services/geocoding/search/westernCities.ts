import { Location } from '../types';

/**
 * Get database of western cities for special case handling
 */
export function getWesternCitiesDatabase(): Record<string, Location> {
  return {
    "california": {
      name: "California, USA",
      latitude: 36.7783,
      longitude: -119.4179,
      placeDetails: "State in United States"
    },
    "new york": {
      name: "New York City, USA",
      latitude: 40.7128,
      longitude: -74.0060,
      placeDetails: "City in United States"
    },
    "london": {
      name: "London, United Kingdom",
      latitude: 51.5074,
      longitude: -0.1278,
      placeDetails: "Capital city of United Kingdom"
    },
    "paris": {
      name: "Paris, France",
      latitude: 48.8566,
      longitude: 2.3522,
      placeDetails: "Capital city of France"
    },
    "tokyo": {
      name: "Tokyo, Japan",
      latitude: 35.6762,
      longitude: 139.6503,
      placeDetails: "Capital city of Japan"
    },
    // Add more western cities as needed
  };
}

/**
 * Find western city by name
 */
export function findWesternCity(name: string): Location | null {
  const cities = getWesternCitiesDatabase();
  const nameLower = name.toLowerCase().trim();
  
  // Direct lookup
  if (cities[nameLower]) {
    return cities[nameLower];
  }
  
  // Partial match
  for (const [key, city] of Object.entries(cities)) {
    if (key.includes(nameLower) || nameLower.includes(key)) {
      return city;
    }
  }
  
  return null;
}

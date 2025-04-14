
/**
 * Location analysis utilities for finding nearest cities and estimating environmental conditions
 */

import { calculateDistance } from './geoCalculations';

/**
 * Find nearest city in a database to coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @param database Array of city data with coordinates
 * @returns The nearest city with distance
 */
export const findNearestCity = <T extends { coordinates: [number, number] }>(
  lat: number,
  lng: number,
  database: T[]
): T & { distance: number } => {
  let closestCity = database[0];
  let shortestDistance = calculateDistance(
    lat, lng, 
    database[0].coordinates[0], 
    database[0].coordinates[1]
  );

  for (let i = 1; i < database.length; i++) {
    const city = database[i];
    const distance = calculateDistance(
      lat, lng, 
      city.coordinates[0], 
      city.coordinates[1]
    );

    if (distance < shortestDistance) {
      shortestDistance = distance;
      closestCity = city;
    }
  }

  return {
    ...closestCity,
    distance: shortestDistance
  };
};

/**
 * Estimate Bortle scale based on population density and urbanization
 * @param lat Latitude
 * @param lng Longitude
 * @returns Estimated Bortle scale
 */
export const estimateBortleScale = (lat: number, lng: number): number => {
  // Major urban regions with high light pollution
  if (
    // Eastern China
    (lat > 22 && lat < 40 && lng > 113 && lng < 122) ||
    // Japan
    (lat > 34 && lat < 37 && lng > 138 && lng < 141) ||
    // NE USA
    (lat > 40 && lat < 43 && lng > -75 && lng < -73)
  ) {
    return 7;
  }
  
  // Medium cities and suburbs
  if (
    // Western Europe
    (lat > 48 && lat < 53 && lng > 0 && lng < 10) ||
    // US West Coast
    (lat > 32 && lat < 38 && lng > -123 && lng < -117)
  ) {
    return 5;
  }
  
  // Dark regions
  if (
    // Central Australia
    (lat < -20 && lat > -30 && lng > 130 && lng < 140) ||
    // Sahara
    (lat > 20 && lat < 30 && lng > 10 && lng < 25) ||
    // Remote Canada
    (lat > 50 && lat < 60 && lng > -100 && lng < -90)
  ) {
    return 2;
  }
  
  // Default middle value
  return 4;
};

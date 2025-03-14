
/**
 * Implementation of location finding algorithms
 */
import { LocationEntry } from "../locationDatabase";
import { calculateDistance } from "./distanceCalculator";

/**
 * Find the closest location to given coordinates
 */
export function findClosestLocationImpl(
  latitude: number, 
  longitude: number, 
  locationDatabase: LocationEntry[]
): {
  name: string;
  bortleScale: number;
  distance: number;
  type?: string;
} {
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return {
      name: `Unknown Location`,
      bortleScale: 5,
      distance: 0
    };
  }

  let closestLocation = {
    name: "",
    bortleScale: 5,
    distance: Number.MAX_VALUE,
    type: undefined
  };

  // Calculate distances to all known locations
  for (const location of locationDatabase) {
    const [locLat, locLng] = location.coordinates;
    const distance = calculateDistance(latitude, longitude, locLat, locLng);
    
    // If we're within the radius of a location, it's likely to have the same light pollution characteristics
    if (distance <= location.radius) {
      // If multiple locations match, prefer the closer one
      if (distance < closestLocation.distance) {
        closestLocation = {
          name: location.name,
          bortleScale: location.bortleScale,
          distance: distance,
          type: location.type
        };
      }
    }
    // Also track the absolute closest location overall
    else if (distance < closestLocation.distance) {
      closestLocation = {
        name: location.name,
        bortleScale: location.bortleScale,
        distance: distance,
        type: location.type
      };
    }
  }

  // If no close match found, generate an interpolated bortleScale based on surrounding areas
  if (closestLocation.distance > 100) {
    // Find the weighted average of the 3 closest locations
    const sortedLocations = [...locationDatabase]
      .map(loc => ({
        ...loc,
        distance: calculateDistance(latitude, longitude, loc.coordinates[0], loc.coordinates[1])
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
    
    // Calculate weighted Bortle scale (closer locations have more influence)
    let totalWeight = 0;
    let weightedBortleSum = 0;
    
    for (const loc of sortedLocations) {
      const weight = 1 / Math.max(1, loc.distance);
      totalWeight += weight;
      weightedBortleSum += loc.bortleScale * weight;
    }
    
    const estimatedBortle = totalWeight > 0 ? weightedBortleSum / totalWeight : 5;
    
    return {
      name: `Area near ${closestLocation.name}`,
      bortleScale: estimatedBortle,
      distance: closestLocation.distance
    };
  }

  return closestLocation;
}

/**
 * Get a friendly location name with accurate Bortle scale
 */
export function getLocationInfoImpl(
  latitude: number, 
  longitude: number, 
  locationDatabase: LocationEntry[]
): {
  name: string;
  bortleScale: number;
  formattedName: string;
} {
  const result = findClosestLocationImpl(latitude, longitude, locationDatabase);
  
  // Format the name based on distance
  let formattedName = result.name;
  
  if (result.distance > 15 && result.distance <= 50) {
    formattedName = `Near ${result.name}`;
  } else if (result.distance > 50 && result.distance <= 100) {
    formattedName = `${result.name} region`;
  } else if (result.distance > 100) {
    formattedName = `Remote area`;
  }
  
  return {
    name: result.name,
    bortleScale: result.bortleScale,
    formattedName
  };
}

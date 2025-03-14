
/**
 * Implementation of location finding algorithms
 */
import { LocationEntry } from "../locationDatabase";
import { calculateDistance } from "./distanceCalculator";

/**
 * Find the closest location to given coordinates
 * Enhanced algorithm with terrain type weighting and multi-point interpolation
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

  // First pass: Find locations within their defined radius (most accurate)
  let locationsWithinRadius: Array<{location: LocationEntry, distance: number}> = [];
  
  for (const location of locationDatabase) {
    const [locLat, locLng] = location.coordinates;
    const distance = calculateDistance(latitude, longitude, locLat, locLng);
    
    // If we're within the radius of a location, it's likely to have the same light pollution characteristics
    if (distance <= location.radius) {
      locationsWithinRadius.push({
        location,
        distance
      });
    }
    
    // Also track the absolute closest location as a fallback
    if (distance < closestLocation.distance) {
      closestLocation = {
        name: location.name,
        bortleScale: location.bortleScale,
        distance: distance,
        type: location.type
      };
    }
  }
  
  // If we have locations within their defined radius, use weighted average of them
  // This is more accurate than just using the single closest point
  if (locationsWithinRadius.length > 0) {
    // Sort by distance (closest first)
    locationsWithinRadius.sort((a, b) => a.distance - b.distance);
    
    // If we only have one location within radius, use it directly
    if (locationsWithinRadius.length === 1) {
      const closest = locationsWithinRadius[0];
      return {
        name: closest.location.name,
        bortleScale: closest.location.bortleScale,
        distance: closest.distance,
        type: closest.location.type
      };
    }
    
    // Get weighted average of Bortle scale from all locations within radius
    // Closer locations and natural/dark-site types get higher weight
    let totalWeight = 0;
    let weightedBortleSum = 0;
    
    // Use at most 3 closest locations to avoid over-smoothing
    const locationsToUse = locationsWithinRadius.slice(0, 3);
    
    for (const item of locationsToUse) {
      // Base weight is inverse of distance (closer = higher weight)
      let weight = 1 / Math.max(1, item.distance);
      
      // Give more weight to natural areas and dark sites for better accuracy
      if (item.location.type === 'natural' || item.location.type === 'dark-site') {
        weight *= 1.5;
      }
      
      // Mountains at higher elevations tend to have darker skies
      if (item.location.type === 'natural' && 
          item.location.name.toLowerCase().includes('mountain') || 
          item.location.name.toLowerCase().includes('mountains') ||
          item.location.name.toLowerCase().includes('peak') ||
          item.location.name.toLowerCase().includes('range')) {
        weight *= 1.3;
      }
      
      totalWeight += weight;
      weightedBortleSum += item.location.bortleScale * weight;
    }
    
    const calculatedBortle = totalWeight > 0 ? weightedBortleSum / totalWeight : 5;
    
    // Use the closest location's name but the weighted Bortle scale
    return {
      name: locationsWithinRadius[0].location.name,
      bortleScale: calculatedBortle,
      distance: locationsWithinRadius[0].distance,
      type: locationsWithinRadius[0].location.type
    };
  }

  // If no close match found and location is far away, create a more accurate interpolation
  if (closestLocation.distance > 50) {
    // Find the weighted average of the 5 closest locations (more points for better interpolation)
    const sortedLocations = [...locationDatabase]
      .map(loc => ({
        ...loc,
        distance: calculateDistance(latitude, longitude, loc.coordinates[0], loc.coordinates[1])
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
    
    // Calculate weighted Bortle scale with terrain-type awareness
    let totalWeight = 0;
    let weightedBortleSum = 0;
    
    for (const loc of sortedLocations) {
      // Base weight - inverse square of distance for sharper falloff with distance
      const weight = 1 / Math.pow(Math.max(1, loc.distance), 1.8);
      
      // Apply terrain type modifiers for better accuracy
      let modifiedWeight = weight;
      
      // Natural areas and mountains have stronger influence on dark skies
      if (loc.type === 'natural' || loc.type === 'dark-site') {
        modifiedWeight *= 1.4;
      } else if (loc.type === 'urban') {
        // Urban light pollution has strong but localized influence
        modifiedWeight *= loc.distance < 30 ? 1.6 : 0.8;
      }
      
      totalWeight += modifiedWeight;
      weightedBortleSum += loc.bortleScale * modifiedWeight;
    }
    
    const estimatedBortle = totalWeight > 0 ? weightedBortleSum / totalWeight : 5;
    
    // Round to one decimal place for consistency
    const finalBortle = Math.round(estimatedBortle * 10) / 10;
    
    return {
      name: `Area near ${closestLocation.name}`,
      bortleScale: finalBortle,
      distance: closestLocation.distance,
      type: closestLocation.type
    };
  }

  return closestLocation;
}

/**
 * Get a friendly location name with accurate Bortle scale
 * Enhanced with more descriptive naming
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
  
  // Format the name based on distance and location type
  let formattedName = result.name;
  
  if (result.distance > 15 && result.distance <= 50) {
    // Different formatting based on location type
    if (result.type === 'natural' || result.type === 'dark-site') {
      formattedName = `${result.name} region`;
    } else {
      formattedName = `Near ${result.name}`;
    }
  } else if (result.distance > 50 && result.distance <= 100) {
    // For more distant locations
    if (result.type === 'natural') {
      formattedName = `${result.name} vicinity`;
    } else if (result.type === 'urban' || result.type === 'suburban') {
      formattedName = `${result.name} region`;
    } else {
      formattedName = `${result.name} area`;
    }
  } else if (result.distance > 100) {
    // For very distant locations, be more generic
    if (result.type === 'natural') {
      formattedName = `Remote natural area`;
    } else {
      formattedName = `Remote region`;
    }
  }
  
  return {
    name: result.name,
    bortleScale: result.bortleScale,
    formattedName
  };
}

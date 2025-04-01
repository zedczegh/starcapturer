
/**
 * Implementation of location finding algorithms
 */
import { LocationEntry } from "../locationDatabase";
import { calculateDistance } from "./distanceCalculator";

/**
 * Find locations within their defined radius
 */
function findLocationsWithinEffectiveRadius(
  latitude: number,
  longitude: number,
  locationDatabase: LocationEntry[]
): Array<{location: LocationEntry, distance: number}> {
  const locationsWithinRadius: Array<{location: LocationEntry, distance: number}> = [];
  
  for (const location of locationDatabase) {
    const [locLat, locLng] = location.coordinates;
    const distance = calculateDistance(latitude, longitude, locLat, locLng);
    
    // Special handling for Tibetan cities and other remote urban areas
    // Increase the effective radius for these areas to better reflect their light pollution spread
    let effectiveRadius = location.radius;
    
    // Enhance radius for urban areas in Tibet, Xinjiang, Mongolia and remote regions
    if (location.type === 'urban' && 
        ((locLat > 27 && locLat < 33 && locLng > 85 && locLng < 95) || // Tibet
         (locLat > 35 && locLat < 48 && locLng > 75 && locLng < 95) || // Xinjiang
         (locLat > 38 && locLat < 46 && locLng > 105 && locLng < 125) || // Inner Mongolia
         (locLat > 40 && locLat < 50 && locLng > 120 && locLng < 135))) { // Northeast
      effectiveRadius = location.radius * 1.5; // 50% larger effective radius
    }
    
    // If we're within the radius of a location, it's likely to have the same light pollution characteristics
    if (distance <= effectiveRadius) {
      locationsWithinRadius.push({
        location,
        distance
      });
    }
  }
  
  return locationsWithinRadius.sort((a, b) => a.distance - b.distance);
}

/**
 * Calculate weighted Bortle scale from nearby locations
 */
function calculateWeightedBortleScale(
  locations: Array<{location: LocationEntry, distance: number}>,
  isRemoteRegion: boolean
): number {
  if (locations.length === 0) return 5;
  
  if (locations.length === 1) {
    return locations[0].location.bortleScale;
  }
  
  // Use at most 3 closest locations to avoid over-smoothing
  const locationsToUse = locations.slice(0, 3);
  
  let totalWeight = 0;
  let weightedBortleSum = 0;
  
  for (const item of locationsToUse) {
    // Base weight is inverse of distance (closer = higher weight)
    let weight = 1 / Math.max(1, item.distance);
    
    // Location type weighting
    if (item.location.type === 'urban') {
      // Urban areas in remote regions have even stronger influence
      weight *= isRemoteRegion ? 2.5 : 2.0;
    } else if (item.location.type === 'suburban') {
      // Suburban areas also contribute significantly to light pollution
      weight *= isRemoteRegion ? 2.0 : 1.7;
    } else if (item.location.type === 'natural' && 
        (item.location.name.toLowerCase().includes('mountain') || 
        item.location.name.toLowerCase().includes('mountains') ||
        item.location.name.toLowerCase().includes('peak') ||
        item.location.name.toLowerCase().includes('range'))) {
      weight *= 0.8; // Reduced weight for mountains
    }
    
    totalWeight += weight;
    weightedBortleSum += item.location.bortleScale * weight;
  }
  
  return totalWeight > 0 ? weightedBortleSum / totalWeight : 5;
}

/**
 * Check if a location is in a remote region
 */
function isInRemoteRegion(latitude: number, longitude: number): boolean {
  return (
    (latitude > 27 && latitude < 33 && longitude > 85 && longitude < 95) || // Tibet
    (latitude > 35 && latitude < 48 && longitude > 75 && longitude < 95) || // Xinjiang
    (latitude > 38 && latitude < 46 && longitude > 105 && longitude < 125) || // Inner Mongolia
    (latitude > 40 && latitude < 50 && longitude > 120 && longitude < 135) // Northeast
  );
}

/**
 * Calculate interpolated Bortle scale for distant locations
 */
function calculateInterpolatedBortleScale(
  latitude: number, 
  longitude: number, 
  locationDatabase: LocationEntry[],
  isRemoteRegion: boolean
): number {
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
    
    // Urban areas have stronger influence on light pollution (higher weight)
    if (loc.type === 'urban') {
      // Urban areas in remote regions have stronger influence over longer distances
      if (isRemoteRegion) {
        modifiedWeight *= loc.distance < 80 ? 3.0 : 1.5;
      } else {
        // Urban light pollution has strong but localized influence
        // Higher exponent creates a sharper falloff from city centers
        modifiedWeight *= loc.distance < 40 ? 2.5 : 1.0;
      }
    } else if (loc.type === 'suburban') {
      // Suburban areas have moderate but significant light pollution
      if (isRemoteRegion) {
        modifiedWeight *= loc.distance < 60 ? 2.2 : 1.2;
      } else {
        modifiedWeight *= loc.distance < 30 ? 1.8 : 0.9;
      }
    } else if (loc.type === 'natural' || loc.type === 'dark-site') {
      // Natural areas have less influence on increasing light pollution
      modifiedWeight *= 0.7;
    }
    
    totalWeight += modifiedWeight;
    weightedBortleSum += loc.bortleScale * modifiedWeight;
  }
  
  const estimatedBortle = totalWeight > 0 ? weightedBortleSum / totalWeight : 5;
  
  // Round to one decimal place for consistency
  return Math.round(estimatedBortle * 10) / 10;
}

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

  // First find the absolute closest location as a fallback
  for (const location of locationDatabase) {
    const [locLat, locLng] = location.coordinates;
    const distance = calculateDistance(latitude, longitude, locLat, locLng);
    
    if (distance < closestLocation.distance) {
      closestLocation = {
        name: location.name,
        bortleScale: location.bortleScale,
        distance: distance,
        type: location.type
      };
    }
  }

  // Get locations within their defined radius
  const locationsWithinRadius = findLocationsWithinEffectiveRadius(latitude, longitude, locationDatabase);
  
  // If we have locations within their defined radius, use weighted average of them
  // This is more accurate than just using the single closest point
  if (locationsWithinRadius.length > 0) {
    const isRemote = isInRemoteRegion(latitude, longitude);
    const calculatedBortle = calculateWeightedBortleScale(locationsWithinRadius, isRemote);
    
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
    const isRemote = isInRemoteRegion(latitude, longitude);
    let finalBortle = calculateInterpolatedBortleScale(latitude, longitude, locationDatabase, isRemote);
    
    // Apply a floor value for urban areas in remote regions
    if (isRemote && closestLocation.type === 'urban' && closestLocation.distance < 100) {
      // Don't let urban light pollution in remote areas go below a certain threshold
      const minBortleForRemoteUrban = 4.5;
      finalBortle = Math.max(finalBortle, minBortleForRemoteUrban);
    }
    
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
 * Format a location name based on distance and type
 */
function formatLocationName(name: string, distance: number, type?: string): string {
  if (distance <= 15) {
    return name;
  }
  
  if (distance > 15 && distance <= 50) {
    // Different formatting based on location type
    if (type === 'natural' || type === 'dark-site') {
      return `${name} region`;
    } else {
      return `Near ${name}`;
    }
  } 
  
  if (distance > 50 && distance <= 100) {
    // For more distant locations
    if (type === 'natural') {
      return `${name} vicinity`;
    } else if (type === 'urban' || type === 'suburban') {
      return `${name} region`;
    } else {
      return `${name} area`;
    }
  } 
  
  // For very distant locations, be more generic
  if (type === 'natural') {
    return `Remote natural area`;
  } else {
    return `Remote region`;
  }
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
  const formattedName = formatLocationName(result.name, result.distance, result.type);
  
  return {
    name: result.name,
    bortleScale: result.bortleScale,
    formattedName
  };
}


/**
 * Implementation of location finding algorithms
 */
import { LocationEntry } from "../locationDatabase";
import { calculateDistance } from "./distanceCalculator";

/**
 * Find the closest location to given coordinates
 * Enhanced algorithm with terrain type weighting, multi-point interpolation and special handling for mountainous areas
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
  
  // Special array for mountain and dark site locations
  let mountainsAndDarkSites: Array<{location: LocationEntry, distance: number}> = [];
  
  for (const location of locationDatabase) {
    const [locLat, locLng] = location.coordinates;
    const distance = calculateDistance(latitude, longitude, locLat, locLng);
    
    // Special handling for mountains and dark sites - identify them even at greater distances
    if (location.type === 'natural' && 
        (location.name.toLowerCase().includes('mountain') || 
         location.name.toLowerCase().includes('mountains') ||
         location.name.toLowerCase().includes('peak') ||
         location.name.toLowerCase().includes('range') ||
         location.type === 'dark-site')) {
      
      // Use larger effective radius for mountains and dark sites to ensure they're identified
      const effectiveRadius = location.radius * 2.0;
      
      if (distance <= effectiveRadius) {
        mountainsAndDarkSites.push({
          location,
          distance
        });
      }
    }
    
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
  
  // Prioritize mountains and dark sites if we found any within reasonable range
  // This helps ensure we don't miss good astrophotography locations
  if (mountainsAndDarkSites.length > 0) {
    // Sort by distance to find the closest mountain/dark site
    mountainsAndDarkSites.sort((a, b) => a.distance - b.distance);
    const closest = mountainsAndDarkSites[0];
    
    // If this mountain is very close or has very dark skies, prioritize it
    if (closest.distance < 50 || closest.location.bortleScale <= 3) {
      return {
        name: closest.location.name,
        bortleScale: closest.location.bortleScale,
        distance: closest.distance,
        type: closest.location.type
      };
    }
    
    // Also add these to the general locations within radius for weighted calculation
    locationsWithinRadius = [...locationsWithinRadius, ...mountainsAndDarkSites];
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
    // Closer locations and urban types get higher weight for light pollution
    let totalWeight = 0;
    let weightedBortleSum = 0;
    
    // Use at most 3 closest locations to avoid over-smoothing
    const locationsToUse = locationsWithinRadius.slice(0, 3);
    
    for (const item of locationsToUse) {
      // Base weight is inverse of distance (closer = higher weight)
      let weight = 1 / Math.max(1, item.distance);
      
      // Enhanced urban weighting for remote regions to account for concentrated light sources
      const [locLat, locLng] = item.location.coordinates;
      const isRemoteRegion = (
        (locLat > 27 && locLat < 33 && locLng > 85 && locLng < 95) || // Tibet
        (locLat > 35 && locLat < 48 && locLng > 75 && locLng < 95) || // Xinjiang
        (locLat > 38 && locLat < 46 && locLng > 105 && locLng < 125) || // Inner Mongolia
        (locLat > 40 && locLat < 50 && locLng > 120 && locLng < 135) // Northeast
      );
      
      // Give more weight to urban areas for light pollution (cities dominate nearby areas)
      if (item.location.type === 'urban') {
        // Urban areas in remote regions have even stronger influence
        weight *= isRemoteRegion ? 2.5 : 2.0;
      } else if (item.location.type === 'suburban') {
        // Suburban areas also contribute significantly to light pollution
        weight *= isRemoteRegion ? 2.0 : 1.7;
      }
      
      // Mountains and dark sites get lower weights - they block light less effectively
      // This better represents how dark these areas actually are
      if (item.location.type === 'natural' && 
          (item.location.name.toLowerCase().includes('mountain') || 
          item.location.name.toLowerCase().includes('mountains') ||
          item.location.name.toLowerCase().includes('peak') ||
          item.location.name.toLowerCase().includes('range'))) {
        weight *= 0.7; // Reduced weight for mountains to better preserve their darkness
      } else if (item.location.type === 'dark-site') {
        weight *= 0.6; // Even lower weight for designated dark sites
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
    
    // First, check if we're in a special region where urban centers should have more influence
    const isRemoteRegion = (
      (latitude > 27 && latitude < 33 && longitude > 85 && longitude < 95) || // Tibet
      (latitude > 35 && latitude < 48 && longitude > 75 && longitude < 95) || // Xinjiang
      (latitude > 38 && latitude < 46 && longitude > 105 && longitude < 125) || // Inner Mongolia
      (latitude > 40 && latitude < 50 && longitude > 120 && longitude < 135) // Northeast
    );
    
    // Special handling for mountainous terrain - check elevation profile
    const isPotentialMountainousArea = 
      (latitude > 25 && latitude < 40 && longitude > 95 && longitude < 103) || // Sichuan mountains
      (latitude > 28 && latitude < 32 && longitude > 88 && longitude < 95) || // Himalayas
      (latitude > 38 && latitude < 43 && longitude > 80 && longitude < 95) || // Tian Shan
      (latitude > 43 && latitude < 47 && longitude > 83 && longitude < 90); // Altai
    
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
      } else if (loc.type === 'natural') {
        // If in a known mountainous area, boost natural areas
        if (isPotentialMountainousArea) {
          // Natural areas in mountainous regions have less light pollution
          modifiedWeight *= 0.65; // Lower weight means less contribution to bortle
        } else {
          // Natural areas have less influence on increasing light pollution
          modifiedWeight *= 0.7;
        }
      } else if (loc.type === 'dark-site') {
        // Dark sites maintain their darkness better
        modifiedWeight *= 0.6;
      }
      
      totalWeight += modifiedWeight;
      weightedBortleSum += loc.bortleScale * modifiedWeight;
    }
    
    const estimatedBortle = totalWeight > 0 ? weightedBortleSum / totalWeight : 5;
    
    // If we're in a known mountainous region with no close urban areas, 
    // the Bortle scale is likely better than calculated
    let finalBortle = estimatedBortle;
    if (isPotentialMountainousArea && closestLocation.distance > 100 && 
        closestLocation.type !== 'urban' && closestLocation.type !== 'suburban') {
      // Apply a ceiling to estimated Bortle in mountainous regions
      finalBortle = Math.min(finalBortle, 3.5);
    }
    
    // Apply a floor value for urban areas in remote regions
    if (isRemoteRegion && closestLocation.type === 'urban' && closestLocation.distance < 100) {
      // Don't let urban light pollution in remote areas go below a certain threshold
      const minBortleForRemoteUrban = 4.5;
      finalBortle = Math.max(finalBortle, minBortleForRemoteUrban);
    }
    
    // Round to one decimal place for consistency
    finalBortle = Math.round(finalBortle * 10) / 10;
    
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

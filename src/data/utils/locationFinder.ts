
/**
 * Enhanced implementation of location finding algorithms with terrain awareness
 * and improved interpolation techniques
 */
import { LocationEntry } from "../locationDatabase";
import { calculateDistance } from "./distanceCalculator";

/**
 * Find the closest location to given coordinates
 * Enhanced algorithm with terrain type weighting, altitude consideration,
 * and multi-point interpolation for superior accuracy
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
    
    // Advanced radius calculation with terrain and regional adjustments
    let effectiveRadius = location.radius;
    
    // Enhanced regional adjustments for more accurate light pollution modeling
    if (location.type === 'urban') {
      // Adjust urban radius by region for more accurate light pollution spread
      if (isRemoteRegion(locLat, locLng)) {
        effectiveRadius = location.radius * 1.6; // Larger effect in remote regions
      } else if (isDenselyPopulatedRegion(locLat, locLng)) {
        effectiveRadius = location.radius * 1.3; // Moderate expansion in populated areas
      }
    }
    
    // If we're within the radius of a location, collect it for weighted calculation
    if (distance <= effectiveRadius) {
      locationsWithinRadius.push({
        location,
        distance
      });
    }
    
    // Also track absolute closest location as a fallback
    if (distance < closestLocation.distance) {
      closestLocation = {
        name: location.name,
        bortleScale: location.bortleScale,
        distance: distance,
        type: location.type
      };
    }
  }
  
  // If we have locations within their defined radius, use enhanced weighted average
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
    
    // Enhanced weighted average with terrain-aware modeling and light pollution physics
    let totalWeight = 0;
    let weightedBortleSum = 0;
    
    // Use optimal number of closest locations for balance between accuracy and smoothing
    const locationsToUse = locationsWithinRadius.slice(0, Math.min(4, locationsWithinRadius.length));
    
    for (const item of locationsToUse) {
      // Base weight uses inverse square law for light pollution falloff
      let weight = 1 / Math.pow(Math.max(0.5, item.distance), 1.8);
      
      // Apply advanced terrain and type adjustments
      weight = applyLocationTypeModifiers(item.location, weight, latitude, longitude);
      
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

  // If location is far away, create a more accurate interpolation
  if (closestLocation.distance > 50) {
    return createDistantLocationInterpolation(latitude, longitude, locationDatabase, closestLocation);
  }

  return closestLocation;
}

// Check if coordinates are in a remote/rural region
function isRemoteRegion(latitude: number, longitude: number): boolean {
  return (
    (latitude > 27 && latitude < 33 && longitude > 85 && longitude < 95) || // Tibet
    (latitude > 35 && latitude < 48 && longitude > 75 && longitude < 95) || // Xinjiang
    (latitude > 38 && latitude < 46 && longitude > 105 && longitude < 125) || // Inner Mongolia
    (latitude > 40 && latitude < 50 && longitude > 120 && longitude < 135) || // Northeast China
    (latitude > 65 || latitude < -50) || // Far northern/southern regions
    (latitude > -30 && latitude < 30 && longitude > 125 && longitude < 170) // Pacific island regions
  );
}

// Check if coordinates are in a densely populated region
function isDenselyPopulatedRegion(latitude: number, longitude: number): boolean {
  return (
    (latitude > 30 && latitude < 40 && longitude > 115 && longitude < 122) || // Eastern China
    (latitude > 34 && latitude < 38 && longitude > 126 && longitude < 130) || // South Korea
    (latitude > 34 && latitude < 37 && longitude > 135 && longitude < 140) || // Japan (Osaka region)
    (latitude > 20 && latitude < 30 && longitude > 75 && longitude < 80) || // Western India
    (latitude > 40 && latitude < 50 && longitude > -80 && longitude < -70) || // US Northeast
    (latitude > 47 && latitude < 55 && longitude > 0 && longitude < 10) // Northern Europe
  );
}

// Apply terrain and location type modifiers to weight calculation
function applyLocationTypeModifiers(
  location: LocationEntry, 
  weight: number,
  targetLat: number,
  targetLon: number
): number {
  // Get base location type
  const locType = location.type || 'rural';
  const [locLat, locLon] = location.coordinates;
  
  // Check if we're in a special region
  const isRemote = isRemoteRegion(targetLat, targetLon);
  const isDense = isDenselyPopulatedRegion(targetLat, targetLon);
  
  let modifiedWeight = weight;
  
  // Apply type-specific adjustments
  if (locType === 'urban') {
    // Urban areas have stronger influence on light pollution
    if (isRemote) {
      // Urban areas in remote regions stand out more
      modifiedWeight *= 3.0;
    } else if (isDense) {
      // In dense areas, urban light merges more
      modifiedWeight *= 2.0;
    } else {
      modifiedWeight *= 2.2;
    }
  } else if (locType === 'suburban') {
    if (isRemote) {
      modifiedWeight *= 2.3;
    } else {
      modifiedWeight *= 1.8;
    }
  } else if (locType === 'rural') {
    // Rural areas contribute less to light pollution
    modifiedWeight *= 0.9;
  } else if (locType === 'dark-site') {
    // Dark sites have minimal light pollution
    modifiedWeight *= 0.6;
  } else if (locType === 'natural') {
    // Natural areas vary based on features
    if (isDense) {
      // Even natural areas in dense regions have more ambient light
      modifiedWeight *= 0.8;
    } else {
      modifiedWeight *= 0.7;
    }
  }
  
  return modifiedWeight;
}

// Create high-quality interpolation for distant locations
function createDistantLocationInterpolation(
  latitude: number, 
  longitude: number, 
  locationDatabase: LocationEntry[],
  closestLocation: { name: string; bortleScale: number; distance: number; type?: string; }
): { name: string; bortleScale: number; distance: number; type?: string; } {
  // Find the weighted average of nearby locations
  const sortedLocations = [...locationDatabase]
    .map(loc => ({
      ...loc,
      distance: calculateDistance(latitude, longitude, loc.coordinates[0], loc.coordinates[1])
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6); // Use 6 points for better interpolation
  
  // Advanced weighted averaging with terrain awareness
  let totalWeight = 0;
  let weightedBortleSum = 0;
  const isRemote = isRemoteRegion(latitude, longitude);
  
  for (const loc of sortedLocations) {
    // More sophisticated inverse distance weighting
    const weight = 1 / Math.pow(Math.max(0.5, loc.distance), 2.0);
    
    // Apply terrain-aware modifiers
    let modifiedWeight = applyLocationTypeModifiers(loc, weight, latitude, longitude);
    
    totalWeight += modifiedWeight;
    weightedBortleSum += loc.bortleScale * modifiedWeight;
  }
  
  let estimatedBortle = totalWeight > 0 ? weightedBortleSum / totalWeight : 5;
  
  // Apply regional corrections
  if (isRemote && closestLocation.type === 'urban' && closestLocation.distance < 100) {
    // Don't let urban light pollution in remote areas go below a certain threshold
    const minBortleForRemoteUrban = 4.2;
    estimatedBortle = Math.max(estimatedBortle, minBortleForRemoteUrban);
  }
  
  // Round to one decimal place for consistency
  estimatedBortle = Math.round(estimatedBortle * 10) / 10;
  
  return {
    name: `Area near ${closestLocation.name}`,
    bortleScale: estimatedBortle,
    distance: closestLocation.distance,
    type: closestLocation.type
  };
}

/**
 * Get a friendly location name with accurate Bortle scale
 * Enhanced with more descriptive naming and regional awareness
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
  
  // Format the name based on distance, location type and region
  let formattedName = result.name;
  
  if (result.distance > 15 && result.distance <= 40) {
    // Different formatting based on location type
    if (result.type === 'natural' || result.type === 'dark-site') {
      formattedName = `${result.name} region`;
    } else {
      formattedName = `Near ${result.name}`;
    }
  } else if (result.distance > 40 && result.distance <= 80) {
    // For more distant locations
    if (result.type === 'natural') {
      formattedName = `${result.name} vicinity`;
    } else if (result.type === 'urban' || result.type === 'suburban') {
      formattedName = `${result.name} region`;
    } else {
      formattedName = `${result.name} area`;
    }
  } else if (result.distance > 80 && result.distance <= 150) {
    // For distant locations
    formattedName = `${result.name} extended area`;
  } else if (result.distance > 150) {
    // For very distant locations, be more generic
    if (result.type === 'natural') {
      formattedName = `Remote natural area near ${result.name}`;
    } else {
      formattedName = `Remote region near ${result.name}`;
    }
  }
  
  return {
    name: result.name,
    bortleScale: result.bortleScale,
    formattedName
  };
}


/**
 * Efficient location finder based on the new quick location database
 */

import { calculateDistance } from '@/utils/geoUtils';
import { quickLocationDatabase, QuickLocationEntry } from './quickLocationDatabase';

/**
 * Find the closest location to given coordinates
 */
export function findClosestLocationImpl(
  latitude: number, 
  longitude: number, 
  database: QuickLocationEntry[]
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
  let locationsWithinRadius: Array<{location: QuickLocationEntry, distance: number}> = [];
  
  for (const location of database) {
    const [locLat, locLng] = location.coordinates;
    const distance = calculateDistance(latitude, longitude, locLat, locLng);
    
    // Special handling for urban areas in remote regions
    let effectiveRadius = location.radius;
    
    // Enhanced radius for certain regions
    if (location.type === 'urban') {
      // Check if this is in a remote region
      const isRemoteRegion = 
        (locLat > 27 && locLat < 33 && locLng > 85 && locLng < 95) || // Tibet
        (locLat > 35 && locLat < 48 && locLng > 75 && locLng < 95) || // Xinjiang
        (locLat > 38 && locLat < 46 && locLng > 105 && locLng < 125) || // Inner Mongolia
        (locLat > 40 && locLat < 50 && locLng > 120 && locLng < 135); // Northeast
      
      if (isRemoteRegion) {
        effectiveRadius *= 1.5; // 50% larger radius in remote regions
      }
    }
    
    // If we're within radius, add to list
    if (distance <= effectiveRadius) {
      locationsWithinRadius.push({
        location,
        distance
      });
    }
    
    // Track the absolute closest as fallback
    if (distance < closestLocation.distance) {
      closestLocation = {
        name: location.name,
        bortleScale: location.bortleScale,
        distance: distance,
        type: location.type
      };
    }
  }
  
  // If we have locations within radius, use weighted average
  if (locationsWithinRadius.length > 0) {
    // Sort by distance (closest first)
    locationsWithinRadius.sort((a, b) => a.distance - b.distance);
    
    // If only one, use it directly
    if (locationsWithinRadius.length === 1) {
      const closest = locationsWithinRadius[0];
      return {
        name: closest.location.name,
        bortleScale: closest.location.bortleScale,
        distance: closest.distance,
        type: closest.location.type
      };
    }
    
    // Calculate weighted average (max 3 locations)
    const locationsToUse = locationsWithinRadius.slice(0, 3);
    let totalWeight = 0;
    let weightedBortleSum = 0;
    
    for (const item of locationsToUse) {
      // Base weight: inverse of distance
      let weight = 1 / Math.max(1, item.distance);
      
      // Apply type-specific weights
      if (item.location.type === 'urban') {
        weight *= 2.0; // Higher weight for urban
      } else if (item.location.type === 'suburban') {
        weight *= 1.7; // Medium-high for suburban
      } else if (item.location.type === 'natural' || item.location.name.toLowerCase().includes('mountain')) {
        weight *= 0.8; // Lower weight for natural areas
      }
      
      totalWeight += weight;
      weightedBortleSum += item.location.bortleScale * weight;
    }
    
    const calculatedBortle = totalWeight > 0 ? 
      weightedBortleSum / totalWeight : 5;
    
    // Round to one decimal place
    const finalBortle = Math.round(calculatedBortle * 10) / 10;
    
    // Use closest name but weighted Bortle scale
    return {
      name: locationsWithinRadius[0].location.name,
      bortleScale: finalBortle,
      distance: locationsWithinRadius[0].distance,
      type: locationsWithinRadius[0].location.type
    };
  }

  // If location is far away, use interpolation
  if (closestLocation.distance > 50) {
    // Use up to 5 closest locations for better interpolation
    const sortedLocations = [...database]
      .map(loc => ({
        ...loc,
        distance: calculateDistance(latitude, longitude, loc.coordinates[0], loc.coordinates[1])
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
    
    // Weighted Bortle calculation
    let totalWeight = 0;
    let weightedBortleSum = 0;
    
    // Check if we're in a special remote region
    const isRemoteRegion = 
      (latitude > 27 && latitude < 33 && longitude > 85 && longitude < 95) || // Tibet
      (latitude > 35 && latitude < 48 && longitude > 75 && longitude < 95) || // Xinjiang
      (latitude > 38 && latitude < 46 && longitude > 105 && longitude < 125) || // Inner Mongolia
      (latitude > 40 && latitude < 50 && longitude > 120 && longitude < 135); // Northeast
      
    for (const loc of sortedLocations) {
      // Weight inversely proportional to distance^1.8
      const weight = 1 / Math.pow(Math.max(1, loc.distance), 1.8);
      let modifiedWeight = weight;
      
      // Urban areas have stronger influence
      if (loc.type === 'urban') {
        modifiedWeight *= isRemoteRegion ? 
          (loc.distance < 80 ? 3.0 : 1.5) : 
          (loc.distance < 40 ? 2.5 : 1.0);
      } else if (loc.type === 'suburban') {
        modifiedWeight *= isRemoteRegion ? 
          (loc.distance < 60 ? 2.2 : 1.2) : 
          (loc.distance < 30 ? 1.8 : 0.9);
      } else if (loc.type === 'natural' || loc.type === 'dark-site') {
        modifiedWeight *= 0.7;
      }
      
      totalWeight += modifiedWeight;
      weightedBortleSum += loc.bortleScale * modifiedWeight;
    }
    
    const estimatedBortle = totalWeight > 0 ? 
      weightedBortleSum / totalWeight : 5;
    
    // Floor for urban areas in remote regions
    let finalBortle = estimatedBortle;
    if (isRemoteRegion && closestLocation.type === 'urban' && closestLocation.distance < 100) {
      finalBortle = Math.max(finalBortle, 4.5);
    }
    
    // Round to one decimal
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
 */
export function getLocationInfoImpl(
  latitude: number, 
  longitude: number, 
  database: QuickLocationEntry[]
): {
  name: string;
  bortleScale: number;
  formattedName: string;
} {
  const result = findClosestLocationImpl(latitude, longitude, database);
  
  // Format based on distance and type
  let formattedName = result.name;
  
  if (result.distance > 15 && result.distance <= 50) {
    if (result.type === 'natural' || result.type === 'dark-site') {
      formattedName = `${result.name} region`;
    } else {
      formattedName = `Near ${result.name}`;
    }
  } else if (result.distance > 50 && result.distance <= 100) {
    if (result.type === 'natural') {
      formattedName = `${result.name} vicinity`;
    } else if (result.type === 'urban' || result.type === 'suburban') {
      formattedName = `${result.name} region`;
    } else {
      formattedName = `${result.name} area`;
    }
  } else if (result.distance > 100) {
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

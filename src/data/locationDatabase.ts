/**
 * Database of locations with accurate Bortle scale values
 * Data sourced from astronomical observations and light pollution maps
 */

export interface LocationEntry {
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
  bortleScale: number;
  radius: number; // km - the approximate radius this location's Bortle scale applies to
  type?: 'urban' | 'rural' | 'dark-site' | 'natural';
}

// Combine all regional location databases
export const locationDatabase: LocationEntry[] = [
  ...asiaLocations,
  ...americasLocations,
  ...europeAfricaLocations,
  ...oceaniaLocations,
  ...middleEastLocations,
  ...polarLocations
];

/**
 * Find the closest location to given coordinates
 * @param latitude Current latitude
 * @param longitude Current longitude
 * @returns The closest location with distance and Bortle scale
 */
export function findClosestLocation(latitude: number, longitude: number): {
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
 * Calculate distance between two points in km using Haversine formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

/**
 * Convert degrees to radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Get a friendly location name with accurate Bortle scale
 */
export function getLocationInfo(latitude: number, longitude: number): {
  name: string;
  bortleScale: number;
  formattedName: string;
} {
  const result = findClosestLocation(latitude, longitude);
  
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

/**
 * Get Bortle scale description based on the value
 */
export function getBortleScaleDescription(bortleScale: number): string {
  // Round to the nearest integer for description lookup
  const scale = Math.min(9, Math.max(1, Math.round(bortleScale)));
  
  const descriptions = {
    1: "Excellent dark sky, Milky Way casts shadows",
    2: "Truly dark sky, Milky Way highly structured",
    3: "Rural sky, some light pollution but good detail",
    4: "Rural/suburban transition, moderate light pollution",
    5: "Suburban sky, Milky Way washed out overhead",
    6: "Bright suburban sky, Milky Way only at zenith",
    7: "Suburban/urban transition, no Milky Way visible",
    8: "City sky, can see only Moon, planets, brightest stars",
    9: "Inner city sky, only very brightest celestial objects visible"
  };
  
  return descriptions[scale as keyof typeof descriptions] || "Unknown light pollution level";
}

/**
 * Get Bortle scale color for visualization
 */
export function getBortleScaleColor(bortleScale: number): string {
  // Round to the nearest integer for color lookup
  const scale = Math.min(9, Math.max(1, Math.round(bortleScale)));
  
  const colors = {
    1: "#000033", // Near black/dark blue
    2: "#000066", // Very dark blue
    3: "#0000cc", // Dark blue
    4: "#0099ff", // Medium blue
    5: "#33cc33", // Green
    6: "#ffff00", // Yellow
    7: "#ff9900", // Orange
    8: "#ff0000", // Red
    9: "#ff00ff"  // Magenta
  };
  
  return colors[scale as keyof typeof colors] || "#ffffff";
}


import { LocationEntry } from "../../locationDatabase";
import { calculateDistance } from "../distanceCalculator";
import { processLocationsByDistance } from "./locationDistanceProcessor";
import { calculateInterpolatedBortle } from "./bortleInterpolator";

export function findClosestLocationStrategy(
  latitude: number, 
  longitude: number, 
  locationDatabase: LocationEntry[]
): {
  name: string;
  bortleScale: number;
  distance: number;
  type?: string;
} {
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
         location.name.toLowerCase().includes('range'))) {
      
      // Use larger effective radius for mountains to ensure they're identified
      const effectiveRadius = location.radius * 2.0;
      
      if (distance <= effectiveRadius) {
        mountainsAndDarkSites.push({
          location,
          distance
        });
      }
    } else if (location.type === 'dark-site') {
      // Special handling for dark sites with larger effective radius
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
  if (mountainsAndDarkSites.length > 0) {
    const mountainResult = processLocationsByDistance(mountainsAndDarkSites, 50);
    if (mountainResult) {
      return mountainResult;
    }
    
    // Also add these to the general locations within radius for weighted calculation
    locationsWithinRadius = [...locationsWithinRadius, ...mountainsAndDarkSites];
  }
  
  // If we have locations within their defined radius, use weighted average of them
  if (locationsWithinRadius.length > 0) {
    const withinRadiusResult = processLocationsByDistance(locationsWithinRadius);
    if (withinRadiusResult) {
      return withinRadiusResult;
    }
  }

  // If no close match found and location is far away, create a more accurate interpolation
  if (closestLocation.distance > 50) {
    return calculateInterpolatedBortle(latitude, longitude, locationDatabase, closestLocation);
  }

  return closestLocation;
}

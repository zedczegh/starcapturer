
import { LocationEntry } from "../../locationDatabase";
import { calculateDistance } from "../distanceCalculator";

export function calculateInterpolatedBortle(
  latitude: number,
  longitude: number,
  locationDatabase: LocationEntry[],
  closestLocation: {
    name: string;
    bortleScale: number;
    distance: number;
    type?: string;
  }
): {
  name: string;
  bortleScale: number;
  distance: number;
  type?: string;
} {
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

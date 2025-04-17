
import { ClimateRegion } from './siqsTypes';

// Array of climate regions with adjustment factors
const climateRegions: ClimateRegion[] = [
  {
    name: "Desert Southwest",
    borders: [[32, -115], [36, -115], [36, -109], [32, -109]],
    adjustmentFactors: [1.1, 1.1, 1.05, 1.0, 0.95, 0.9, 0.8, 0.85, 0.9, 1.0, 1.05, 1.1]
  },
  {
    name: "Pacific Northwest",
    borders: [[42, -124], [49, -124], [49, -116], [42, -116]],
    adjustmentFactors: [0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.1, 1.1, 1.05, 0.9, 0.8, 0.7]
  }
];

/**
 * Find the climate region for a given location
 */
export function findClimateRegion(latitude: number, longitude: number): ClimateRegion | null {
  // Simple implementation for now - just check if point is within rectangular bounds
  for (const region of climateRegions) {
    const [minLat, minLng] = region.borders[0];
    const [maxLat, maxLng] = region.borders[2];
    
    if (latitude >= minLat && latitude <= maxLat && 
        longitude >= minLng && longitude <= maxLng) {
      return region;
    }
  }
  
  return null;
}

/**
 * Get climate adjustment factor for a given location and month
 */
export function getClimateAdjustmentFactor(
  latitude: number,
  longitude: number,
  month: number
): number {
  const region = findClimateRegion(latitude, longitude);
  
  if (region) {
    return region.adjustmentFactors[month];
  }
  
  // Default: no adjustment
  return 1.0;
}

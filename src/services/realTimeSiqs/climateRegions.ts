
import { ClimateRegion } from './siqsTypes';

// Array of climate regions with adjustment factors
const climateRegions: ClimateRegion[] = [
  {
    name: "Desert Southwest",
    region: {
      north: 36,
      south: 32,
      east: -109,
      west: -115
    },
    conditions: {
      humidity: 30,
      temperature: 25,
      cloudCover: 20
    },
    adjustmentFactors: [1.1, 1.1, 1.05, 1.0, 0.95, 0.9, 0.8, 0.85, 0.9, 1.0, 1.05, 1.1]
  },
  {
    name: "Pacific Northwest",
    region: {
      north: 49,
      south: 42,
      east: -116,
      west: -124
    },
    conditions: {
      humidity: 70,
      temperature: 15,
      cloudCover: 60
    },
    adjustmentFactors: [0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.1, 1.1, 1.05, 0.9, 0.8, 0.7]
  }
];

/**
 * Find the climate region for a given location
 */
export function findClimateRegion(latitude: number, longitude: number): ClimateRegion | null {
  // Simple implementation - check if point is within rectangular bounds
  for (const region of climateRegions) {
    const { north, south, east, west } = region.region;
    
    if (latitude >= south && latitude <= north && 
        longitude >= west && longitude <= east) {
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

/**
 * Get climate region for SIQS adjustments
 */
export function getClimateRegion(latitude: number, longitude: number): ClimateRegion | null {
  return findClimateRegion(latitude, longitude);
}

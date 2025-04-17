
import { ClimateRegion } from './siqsTypes';

/**
 * Major climate regions with their characteristic conditions
 */
const climateRegions: ClimateRegion[] = [
  // Desert/Arid climates
  {
    name: 'Desert/Arid',
    region: { north: 35, south: -35, east: 180, west: -180 },
    conditions: { humidity: 20, temperature: 25, cloudCover: 10 },
    adjustmentFactors: [1.2, 0.9, 1.3]
  },
  
  // Tropical climates
  {
    name: 'Tropical',
    region: { north: 23.5, south: -23.5, east: 180, west: -180 },
    conditions: { humidity: 80, temperature: 28, cloudCover: 60 },
    adjustmentFactors: [0.8, 1.1, 0.7]
  },
  
  // Northern polar/sub-polar
  {
    name: 'Northern Polar',
    region: { north: 90, south: 60, east: 180, west: -180 },
    conditions: { humidity: 70, temperature: -10, cloudCover: 50 },
    adjustmentFactors: [0.9, 0.8, 1.1]
  },
  
  // Southern polar/sub-polar
  {
    name: 'Southern Polar',
    region: { north: -60, south: -90, east: 180, west: -180 },
    conditions: { humidity: 70, temperature: -15, cloudCover: 40 },
    adjustmentFactors: [0.9, 0.8, 1.2]
  },
  
  // Mediterranean climate
  {
    name: 'Mediterranean',
    region: { north: 45, south: 30, east: 40, west: -10 },
    conditions: { humidity: 60, temperature: 18, cloudCover: 25 },
    adjustmentFactors: [1.1, 1.0, 1.0]
  }
];

/**
 * Find the climate region for a given location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Climate region or undefined if not found
 */
export function findClimateRegion(latitude: number, longitude: number): ClimateRegion | undefined {
  // Normalize longitude to -180 to 180 range
  const normalizedLon = ((longitude + 180) % 360 + 360) % 360 - 180;
  
  // Find matching climate region
  for (const region of climateRegions) {
    if (
      latitude <= region.region.north &&
      latitude >= region.region.south &&
      (
        // Handle regions that cross the International Date Line
        (region.region.west <= region.region.east &&
          normalizedLon >= region.region.west &&
          normalizedLon <= region.region.east) ||
        (region.region.west > region.region.east &&
          (normalizedLon >= region.region.west || normalizedLon <= region.region.east))
      )
    ) {
      return region;
    }
  }
  
  return undefined;
}

/**
 * Get climate adjustment factor for a location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param factorIndex Which adjustment factor to use (0-2)
 * @returns Adjustment factor (default 1.0)
 */
export function getClimateAdjustmentFactor(
  latitude: number,
  longitude: number,
  factorIndex: number = 0
): number {
  const region = findClimateRegion(latitude, longitude);
  
  if (!region || factorIndex >= region.adjustmentFactors.length) {
    return 1.0; // Default adjustment factor
  }
  
  return region.adjustmentFactors[factorIndex];
}

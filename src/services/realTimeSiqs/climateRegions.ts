
/**
 * Climate region definitions for SIQS adjustments
 */
import { ClimateRegion } from './siqsTypes';

// Define climate regions with their boundaries and adjustment factors
const climateRegions: ClimateRegion[] = [
  {
    name: 'Desert',
    description: 'Very low humidity and clear skies',
    boundaries: {
      latMin: 15, latMax: 35,
      longMin: -120, longMax: -100 // Southwestern US deserts
    },
    adjustmentFactors: [1.1, 0.9, 1.05] // Good for astronomy
  },
  {
    name: 'Tropical',
    description: 'High humidity and frequent cloud cover',
    boundaries: {
      latMin: -23.5, latMax: 23.5,
      longMin: -180, longMax: 180 // Tropical zone (approximate)
    },
    adjustmentFactors: [0.85, 1.1, 0.9] // Less ideal for astronomy
  },
  {
    name: 'Arctic',
    description: 'Cold temperatures but dark skies',
    boundaries: {
      latMin: 66.5, latMax: 90,
      longMin: -180, longMax: 180 // Arctic circle and above
    },
    adjustmentFactors: [1.05, 0.8, 1.2] // Good dark skies, challenging conditions
  }
];

/**
 * Find the climate region for a given location
 */
export function findClimateRegion(latitude: number, longitude: number): ClimateRegion | null {
  // Normalize longitude to -180 to 180 range
  const normLong = ((longitude + 540) % 360) - 180;
  
  for (const region of climateRegions) {
    const { latMin, latMax, longMin, longMax } = region.boundaries;
    
    // Check if location falls within this region's boundaries
    if (
      latitude >= latMin && latitude <= latMax &&
      normLong >= longMin && normLong <= longMax
    ) {
      return region;
    }
  }
  
  // If no specific region found, return null
  return null;
}

/**
 * Get climate region for a location
 * Used as an alias for findClimateRegion for compatibility
 */
export function getClimateRegion(latitude: number, longitude: number): ClimateRegion | null {
  return findClimateRegion(latitude, longitude);
}

/**
 * Get climate adjustment factor for a location
 */
export function getClimateAdjustmentFactor(latitude: number, longitude: number, factorIndex = 0): number {
  const region = findClimateRegion(latitude, longitude);
  if (!region) {
    return 1.0; // Default: no adjustment
  }
  
  return region.adjustmentFactors[factorIndex] || 1.0;
}

/**
 * Get detailed climate info for a location
 */
export function getLocationClimateInfo(latitude: number, longitude: number): any {
  const region = findClimateRegion(latitude, longitude);
  if (!region) {
    return {
      type: 'Temperate',
      clearSkyRate: 65,
      averageTemperature: 15
    };
  }
  
  // Return climate info based on region
  const climateLookup: Record<string, any> = {
    'Desert': {
      type: 'Desert',
      clearSkyRate: 85,
      averageTemperature: 25
    },
    'Tropical': {
      type: 'Tropical',
      clearSkyRate: 50,
      averageTemperature: 28
    },
    'Arctic': {
      type: 'Arctic',
      clearSkyRate: 60,
      averageTemperature: -10
    }
  };
  
  return climateLookup[region.name] || {
    type: 'Unknown',
    clearSkyRate: 65,
    averageTemperature: 15
  };
}

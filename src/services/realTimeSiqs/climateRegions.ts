
/**
 * Climate regions data and utilities for SIQS adjustments
 */

import { ClimateRegion } from './siqsTypes';

// Define major climate regions
const climateRegions: ClimateRegion[] = [
  // North America
  {
    name: "North America - East Coast",
    description: "Eastern coastal region with higher humidity",
    boundaries: {
      latMin: 25,
      latMax: 49,
      longMin: -82,
      longMax: -65
    },
    adjustmentFactors: [0.9, 1.0, 1.0]
  },
  {
    name: "North America - West Coast",
    description: "Western coastal region with moderate climate",
    boundaries: {
      latMin: 32,
      latMax: 49,
      longMin: -125,
      longMax: -115
    },
    adjustmentFactors: [1.0, 1.1, 0.9]
  },
  {
    name: "North America - Southwest",
    description: "Dry desert climate, excellent visibility",
    boundaries: {
      latMin: 27,
      latMax: 42,
      longMin: -115,
      longMax: -103
    },
    adjustmentFactors: [1.2, 0.9, 1.0]
  },
  
  // Europe
  {
    name: "Europe - Mediterranean",
    description: "Mediterranean climate with warm, dry summers",
    boundaries: {
      latMin: 36,
      latMax: 46,
      longMin: -10,
      longMax: 20
    },
    adjustmentFactors: [1.1, 1.0, 0.9]
  },
  {
    name: "Europe - Northern",
    description: "Northern European climate with frequent cloud cover",
    boundaries: {
      latMin: 48,
      latMax: 60,
      longMin: -10,
      longMax: 30
    },
    adjustmentFactors: [0.8, 1.1, 1.0]
  },
  
  // Australia
  {
    name: "Australia - Outback",
    description: "Dry inland regions with excellent dark skies",
    boundaries: {
      latMin: -35,
      latMax: -20,
      longMin: 125,
      longMax: 145
    },
    adjustmentFactors: [1.2, 1.0, 1.0]
  },
  
  // Default region
  {
    name: "Default",
    description: "Default region when no specific region matches",
    boundaries: {
      latMin: -90,
      latMax: 90,
      longMin: -180,
      longMax: 180
    },
    adjustmentFactors: [1.0, 1.0, 1.0]
  }
];

/**
 * Find climate region for a location
 */
export function findClimateRegion(latitude: number, longitude: number): ClimateRegion {
  // Normalize longitude to -180 to 180
  const normalizedLong = ((longitude + 180) % 360 + 360) % 360 - 180;
  
  // Find matching region
  for (const region of climateRegions) {
    const { boundaries } = region;
    
    if (
      latitude >= boundaries.latMin && 
      latitude <= boundaries.latMax && 
      normalizedLong >= boundaries.longMin && 
      normalizedLong <= boundaries.longMax
    ) {
      return region;
    }
  }
  
  // Return default region if no match
  return climateRegions[climateRegions.length - 1];
}

/**
 * Get climate adjustment factor based on region and condition
 */
export function getClimateAdjustmentFactor(
  region: ClimateRegion, 
  conditionIndex: number = 0
): number {
  if (conditionIndex < 0 || conditionIndex >= region.adjustmentFactors.length) {
    return 1.0; // Default no adjustment
  }
  
  return region.adjustmentFactors[conditionIndex];
}

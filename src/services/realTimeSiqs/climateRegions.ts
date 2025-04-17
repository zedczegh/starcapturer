
/**
 * Climate region definitions and functions for SIQS calculations
 */
import { ClimateRegion } from './siqsTypes';
import { haversineDistance } from '@/utils/geoUtils';

// Sample climate regions
const climateRegions: ClimateRegion[] = [
  {
    name: 'Arid Desert',
    region: {
      north: 35,
      south: 20,
      east: -100,
      west: -115
    },
    conditions: {
      humidity: 30,
      temperature: 25,
      cloudCover: 15
    },
    adjustmentFactors: [1.2, 1.15, 0.9] // cloudCover, humidity, temperature
  },
  {
    name: 'Humid Subtropical',
    region: {
      north: 40,
      south: 30,
      east: -75,
      west: -90
    },
    conditions: {
      humidity: 70,
      temperature: 20,
      cloudCover: 40
    },
    adjustmentFactors: [0.85, 0.8, 1.1]
  },
  {
    name: 'Mediterranean',
    region: {
      north: 45,
      south: 35,
      east: 20,
      west: -10
    },
    conditions: {
      humidity: 60,
      temperature: 18,
      cloudCover: 25
    },
    adjustmentFactors: [1.1, 1.0, 1.1]
  },
  {
    name: 'Continental',
    region: {
      north: 60,
      south: 40,
      east: 40,
      west: 10
    },
    conditions: {
      humidity: 55,
      temperature: 10,
      cloudCover: 45
    },
    adjustmentFactors: [0.9, 0.95, 1.0]
  },
  {
    name: 'Tropical',
    region: {
      north: 23,
      south: -23,
      east: 180,
      west: -180
    },
    conditions: {
      humidity: 80,
      temperature: 28,
      cloudCover: 60
    },
    adjustmentFactors: [0.8, 0.75, 0.9]
  }
];

/**
 * Check if a location is within a climate region
 */
function isInRegion(
  latitude: number, 
  longitude: number, 
  region: { north: number; south: number; east: number; west: number }
): boolean {
  // Handle regions that cross the international date line
  if (region.east < region.west) {
    return (
      latitude <= region.north &&
      latitude >= region.south &&
      (longitude <= region.east || longitude >= region.west)
    );
  }
  
  // Regular region check
  return (
    latitude <= region.north &&
    latitude >= region.south &&
    longitude <= region.east &&
    longitude >= region.west
  );
}

/**
 * Get climate region for a location
 */
export function getClimateRegion(
  latitude: number, 
  longitude: number
): ClimateRegion | null {
  for (const region of climateRegions) {
    if (isInRegion(latitude, longitude, region.region)) {
      return region;
    }
  }
  return null;
}

/**
 * Find climate region by location
 */
export function findClimateRegion(
  latitude: number,
  longitude: number
): ClimateRegion | null {
  return getClimateRegion(latitude, longitude);
}

/**
 * Get climate adjustment factor
 */
export function getClimateAdjustmentFactor(
  climateRegion: ClimateRegion | null,
  factorIndex: number
): number {
  if (!climateRegion || factorIndex < 0 || factorIndex >= 3) return 1.0;
  return climateRegion.adjustmentFactors[factorIndex] || 1.0;
}

/**
 * Get location climate info
 */
export function getLocationClimateInfo(
  latitude: number,
  longitude: number
): {
  region: string;
  clearSkyRate: number;
  bestMonths: number[];
  characteristic: string;
} {
  const region = getClimateRegion(latitude, longitude);
  
  if (region) {
    return {
      region: region.name,
      clearSkyRate: 100 - region.conditions.cloudCover,
      bestMonths: getSeasonalMonthsForRegion(region),
      characteristic: getClimateCharacteristic(region)
    };
  }
  
  // Default if no specific region found
  return {
    region: 'Temperate',
    clearSkyRate: 60,
    bestMonths: [4, 5, 8, 9], // Apr, May, Aug, Sep
    characteristic: 'Variable conditions'
  };
}

// Helper functions for climate info
function getSeasonalMonthsForRegion(region: ClimateRegion): number[] {
  // Return best months based on climate type
  switch (region.name) {
    case 'Arid Desert': 
      return [1, 2, 11, 12]; // Winter months are best
    case 'Humid Subtropical': 
      return [9, 10, 11]; // Fall is best
    case 'Mediterranean': 
      return [6, 7, 8, 9]; // Summer and early fall
    case 'Continental': 
      return [3, 4, 9, 10]; // Spring and fall
    case 'Tropical': 
      return [1, 2, 7, 8]; // Dry seasons
    default: 
      return [4, 5, 9, 10]; // General best months
  }
}

function getClimateCharacteristic(region: ClimateRegion): string {
  switch (region.name) {
    case 'Arid Desert': 
      return 'Low humidity, clear skies';
    case 'Humid Subtropical': 
      return 'Seasonal storms, humid summers';
    case 'Mediterranean': 
      return 'Dry summers, mild winters';
    case 'Continental': 
      return 'Distinct seasons, cold winters';
    case 'Tropical': 
      return 'Wet and dry seasons, high humidity';
    default: 
      return 'Various climate patterns';
  }
}

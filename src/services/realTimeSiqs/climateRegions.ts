
import { ClimateRegion } from './siqsTypes';

export const climateRegions: ClimateRegion[] = [
  {
    id: "desert",
    name: "Desert",
    borders: {
      north: 45,
      south: -30,
      east: 140,
      west: -120
    },
    adjustmentFactors: {
      humidity: 0.8,
      temperature: 1.2,
      cloudCover: 0.7
    }
  },
  {
    id: "tropical",
    name: "Tropical",
    borders: {
      north: 23.5,
      south: -23.5,
      east: 180,
      west: -180
    },
    adjustmentFactors: {
      humidity: 1.3,
      temperature: 0.9,
      cloudCover: 1.4
    }
  },
  {
    id: "temperate",
    name: "Temperate",
    borders: {
      north: 60,
      south: 23.5,
      east: 180,
      west: -180
    },
    adjustmentFactors: {
      humidity: 1.0,
      temperature: 1.0,
      cloudCover: 1.0
    }
  }
];

/**
 * Get the climate region for a given location
 */
export function getClimateRegion(latitude: number, longitude: number): ClimateRegion {
  // Default to temperate if not found
  let region = climateRegions.find(r => 
    latitude <= r.borders.north &&
    latitude >= r.borders.south &&
    longitude <= r.borders.east &&
    longitude >= r.borders.west
  );
  
  return region || climateRegions[2]; // Default to temperate
}

/**
 * Get adjustment factors for weather conditions based on climate region
 */
export function getClimateAdjustmentFactors(latitude: number, longitude: number) {
  const region = getClimateRegion(latitude, longitude);
  return region.adjustmentFactors;
}


import { ClimateRegion } from './siqsTypes';

// Define climate regions with their location boundaries and general conditions
const climateRegions: ClimateRegion[] = [
  {
    name: "Arid Desert",
    region: {
      north: 35,
      south: 15,
      east: 45,
      west: -20
    },
    conditions: {
      humidity: 20,
      temperature: 25,
      cloudCover: 10
    },
    adjustmentFactors: [1.2, 0.8, 1.0]
  },
  {
    name: "Tropical",
    region: {
      north: 23.5,
      south: -23.5,
      east: 180,
      west: -180
    },
    conditions: {
      humidity: 80,
      temperature: 27,
      cloudCover: 60
    },
    adjustmentFactors: [0.7, 0.9, 0.8]
  },
  {
    name: "Temperate",
    region: {
      north: 66.5,
      south: 23.5,
      east: 180,
      west: -180
    },
    conditions: {
      humidity: 60,
      temperature: 15,
      cloudCover: 40
    },
    adjustmentFactors: [1.0, 1.0, 1.0]
  },
  {
    name: "Polar",
    region: {
      north: 90,
      south: 66.5,
      east: 180,
      west: -180
    },
    conditions: {
      humidity: 40,
      temperature: -10,
      cloudCover: 30
    },
    adjustmentFactors: [1.1, 0.7, 1.2]
  }
];

/**
 * Get the climate region for a given location
 */
export function getClimateRegion(latitude: number, longitude: number): ClimateRegion {
  // Default to temperate if no match
  let region: ClimateRegion = climateRegions[2];
  
  for (const r of climateRegions) {
    if (
      latitude <= r.region.north && 
      latitude >= r.region.south &&
      longitude <= r.region.east &&
      longitude >= r.region.west
    ) {
      region = r;
      break;
    }
  }
  
  return region;
}

/**
 * Get climate information for a location
 */
export function getLocationClimateInfo(latitude: number, longitude: number): any {
  const region = getClimateRegion(latitude, longitude);
  
  return {
    climate: region.name,
    typicalConditions: {
      humidity: region.conditions.humidity,
      temperature: region.conditions.temperature,
      cloudCover: region.conditions.cloudCover
    },
    seasonality: getSeasonal(latitude, longitude)
  };
}

/**
 * Get seasonal information based on latitude
 */
function getSeasonal(latitude: number, longitude: number): any {
  // Northern hemisphere
  if (latitude > 0) {
    return {
      bestMonths: ["June", "July", "August", "September"],
      worstMonths: ["November", "December", "January", "February"]
    };
  } 
  // Southern hemisphere
  else {
    return {
      bestMonths: ["December", "January", "February", "March"],
      worstMonths: ["May", "June", "July", "August"]
    };
  }
}

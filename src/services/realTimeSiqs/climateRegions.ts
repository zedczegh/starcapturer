
import { ClimateRegion } from './siqsTypes';

/**
 * Climate regions for SIQS calculations
 */
const climateRegions: ClimateRegion[] = [
  {
    name: "Desert",
    description: "Hot and dry, minimal cloud cover",
    boundaries: {
      latMin: -30,
      latMax: 30,
      longMin: -120,
      longMax: -100
    },
    adjustmentFactors: [1.15, 1.1, 1.08]
  },
  {
    name: "Tropical",
    description: "Hot and humid, variable cloud cover",
    boundaries: {
      latMin: -23,
      latMax: 23,
      longMin: -180,
      longMax: 180
    },
    adjustmentFactors: [0.85, 0.9, 0.93]
  },
  {
    name: "Temperate",
    description: "Moderate temperatures and humidity",
    boundaries: {
      latMin: 23,
      latMax: 66,
      longMin: -180,
      longMax: 180
    },
    adjustmentFactors: [1.0, 1.0, 1.0]
  },
  {
    name: "Polar",
    description: "Cold with variable cloud cover",
    boundaries: {
      latMin: 66,
      latMax: 90,
      longMin: -180,
      longMax: 180
    },
    adjustmentFactors: [0.9, 1.2, 0.85]
  }
];

/**
 * Find matching climate region for a location
 */
export function findClimateRegion(latitude: number, longitude: number): ClimateRegion | null {
  for (const region of climateRegions) {
    if (
      latitude >= region.boundaries.latMin &&
      latitude <= region.boundaries.latMax &&
      longitude >= region.boundaries.longMin &&
      longitude <= region.boundaries.longMax
    ) {
      return region;
    }
  }
  
  // Default to Temperate if no match found
  return climateRegions.find(r => r.name === "Temperate") || null;
}

/**
 * Get adjustment factor for climate region
 */
export function getClimateAdjustmentFactor(region: ClimateRegion | null): number {
  if (!region) return 1.0;
  
  // Choose a factor based on current conditions
  // For simplicity, use the middle factor
  return region.adjustmentFactors[1] || 1.0;
}

/**
 * Get climate region by name
 */
export function getClimateRegion(latitude: number, longitude: number): ClimateRegion | null {
  return findClimateRegion(latitude, longitude);
}

/**
 * Get detailed climate information for a location
 */
export function getLocationClimateInfo(latitude: number, longitude: number): any {
  const region = findClimateRegion(latitude, longitude);
  
  if (!region) {
    return {
      name: "Unknown",
      description: "No specific climate information available",
      bestMonths: []
    };
  }
  
  // Determine best months based on climate region
  let bestMonths: string[] = [];
  
  switch(region.name) {
    case "Desert":
      bestMonths = ["Oct", "Nov", "Dec", "Jan", "Feb"];
      break;
    case "Tropical":
      bestMonths = ["Jun", "Jul", "Aug"];
      break;
    case "Temperate":
      // Northern hemisphere
      if (latitude > 0) {
        bestMonths = ["Apr", "May", "Sep", "Oct"];
      } else {
        // Southern hemisphere
        bestMonths = ["Oct", "Nov", "Mar", "Apr"];
      }
      break;
    case "Polar":
      // Northern hemisphere winter (darker skies)
      if (latitude > 0) {
        bestMonths = ["Nov", "Dec", "Jan", "Feb"];
      } else {
        // Southern hemisphere winter
        bestMonths = ["May", "Jun", "Jul", "Aug"];
      }
      break;
    default:
      bestMonths = ["Mar", "Apr", "Sep", "Oct"];
  }
  
  return {
    name: region.name,
    description: region.description,
    bestMonths: bestMonths,
    averageClearDays: calculateAverageClearDays(region.name, latitude),
    seasonalCharacteristics: getSeasonalCharacteristics(region.name, latitude > 0)
  };
}

/**
 * Calculate average clear days for climate regions
 */
function calculateAverageClearDays(climateName: string, latitude: number): number {
  // Rough estimates for each climate region
  switch(climateName) {
    case "Desert":
      return 250;
    case "Tropical":
      return 120;
    case "Temperate":
      return Math.abs(latitude) > 45 ? 150 : 180;
    case "Polar":
      return 100;
    default:
      return 150;
  }
}

/**
 * Get seasonal characteristics for climate region
 */
function getSeasonalCharacteristics(climateName: string, isNorthernHemisphere: boolean): any {
  const seasons = isNorthernHemisphere 
    ? { winter: "Dec-Feb", spring: "Mar-May", summer: "Jun-Aug", fall: "Sep-Nov" }
    : { winter: "Jun-Aug", spring: "Sep-Nov", summer: "Dec-Feb", fall: "Mar-May" };
  
  // Add climate-specific characteristics
  switch(climateName) {
    case "Desert":
      return {
        ...seasons,
        bestSeason: isNorthernHemisphere ? "winter" : "winter",
        characteristics: "Very clear nights, excellent transparency"
      };
    case "Tropical":
      return {
        ...seasons,
        bestSeason: isNorthernHemisphere ? "summer" : "winter",
        characteristics: "High humidity, but good viewing during dry season"
      };
    case "Temperate":
      return {
        ...seasons,
        bestSeason: "spring",
        characteristics: "Variable conditions, best in spring and fall"
      };
    case "Polar":
      return {
        ...seasons,
        bestSeason: "winter",
        characteristics: "Long nights in winter, midnight sun in summer"
      };
    default:
      return { ...seasons };
  }
}

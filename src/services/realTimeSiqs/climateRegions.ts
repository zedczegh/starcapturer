
/**
 * Climate region utilities for SIQS calculation
 */

interface ClimateRegion {
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  description?: string;
}

// Basic climate regions classification
const CLIMATE_REGIONS: ClimateRegion[] = [
  {
    name: "Arctic",
    minLat: 66.5,
    maxLat: 90,
    minLng: -180,
    maxLng: 180,
    description: "Very cold with low humidity, often excellent for astronomy when dark."
  },
  {
    name: "Desert",
    minLat: 15,
    maxLat: 35,
    minLng: -120,
    maxLng: 130,
    description: "Dry air with excellent transparency and low humidity."
  },
  {
    name: "Tropical",
    minLat: -23.5,
    maxLat: 23.5,
    minLng: -180,
    maxLng: 180,
    description: "High humidity and heat can impact viewing conditions."
  },
  {
    name: "Mediterranean",
    minLat: 30,
    maxLat: 45,
    minLng: -10,
    maxLng: 40,
    description: "Mild conditions with generally good viewing opportunities."
  },
  {
    name: "Temperate",
    minLat: 40,
    maxLat: 60,
    minLng: -180,
    maxLng: 180,
    description: "Variable conditions with seasonality affecting viewing."
  }
];

/**
 * Get climate region for a specific location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns ClimateRegion or undefined if not found
 */
export function getClimateRegion(
  latitude: number,
  longitude: number
): ClimateRegion | undefined {
  // Find matching climate region
  return CLIMATE_REGIONS.find(region => 
    latitude >= region.minLat && 
    latitude <= region.maxLat && 
    longitude >= region.minLng && 
    longitude <= region.maxLng
  );
}

/**
 * Get detailed climate information for a location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Climate information object
 */
export function getLocationClimateInfo(
  latitude: number,
  longitude: number
): {
  averageCloudiness: number;
  seasonalVariation: string;
  clearSkyAverage: number;
} {
  const region = getClimateRegion(latitude, longitude);
  
  // Default values
  let averageCloudiness = 50; // percent
  let seasonalVariation = "Moderate";
  let clearSkyAverage = 60; // percent
  
  // Adjust values based on climate region
  if (region) {
    switch (region.name) {
      case "Arctic":
        averageCloudiness = 60;
        seasonalVariation = "Extreme";
        clearSkyAverage = 40;
        break;
      case "Desert":
        averageCloudiness = 20;
        seasonalVariation = "Low";
        clearSkyAverage = 85;
        break;
      case "Tropical":
        averageCloudiness = 70;
        seasonalVariation = "Low";
        clearSkyAverage = 45;
        break;
      case "Mediterranean":
        averageCloudiness = 40;
        seasonalVariation = "Moderate";
        clearSkyAverage = 65;
        break;
      case "Temperate":
      default:
        // Use default values
        break;
    }
  }
  
  return {
    averageCloudiness,
    seasonalVariation,
    clearSkyAverage
  };
}

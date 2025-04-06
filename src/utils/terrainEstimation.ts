
/**
 * Utility for estimating Bortle scale based on terrain and population
 */

import { isWaterLocation } from "./locationValidator";

// Terrain types and their impact on Bortle scale
export enum TerrainType {
  Mountains = "mountains",
  Desert = "desert",
  Forest = "forest",
  Plains = "plains",
  Coastal = "coastal",
  Urban = "urban"
}

/**
 * Get estimated Bortle scale based on terrain and population information
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @param locationName Optional location name for additional context
 * @returns Estimated Bortle scale or null if estimation failed
 */
export async function getBortleFromTerrainAndPopulation(
  latitude: number,
  longitude: number,
  locationName?: string
): Promise<number | null> {
  // Skip processing for water locations
  if (isWaterLocation(latitude, longitude)) {
    console.log(`Skipping terrain estimation for water location at ${latitude}, ${longitude}`);
    return null;
  }
  
  try {
    // Detect terrain type based on coordinates and name
    const terrainType = await detectTerrainType(latitude, longitude, locationName);
    console.log(`Detected terrain type for ${latitude}, ${longitude}: ${terrainType}`);
    
    // Get population density estimate
    const populationDensity = await estimatePopulationDensity(latitude, longitude, locationName);
    
    // Calculate Bortle scale based on terrain and population
    return calculateBortleFromTerrainAndPopulation(terrainType, populationDensity);
  } catch (error) {
    console.error("Error estimating Bortle scale from terrain:", error);
    return null;
  }
}

/**
 * Detect terrain type based on coordinates and location name
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @param locationName Optional location name for additional context
 * @returns Detected terrain type
 */
export async function detectTerrainType(
  latitude: number,
  longitude: number,
  locationName?: string
): Promise<TerrainType> {
  // Use location name as a hint if available
  if (locationName) {
    const nameLower = locationName.toLowerCase();
    
    if (nameLower.includes("mountain") || nameLower.includes("hill") || nameLower.includes("peak")) {
      return TerrainType.Mountains;
    }
    
    if (nameLower.includes("desert") || nameLower.includes("sand") || nameLower.includes("dune")) {
      return TerrainType.Desert;
    }
    
    if (nameLower.includes("forest") || nameLower.includes("wood") || nameLower.includes("jungle")) {
      return TerrainType.Forest;
    }
    
    if (nameLower.includes("plain") || nameLower.includes("prairie") || nameLower.includes("field")) {
      return TerrainType.Plains;
    }
    
    if (nameLower.includes("coast") || nameLower.includes("beach") || nameLower.includes("shore")) {
      return TerrainType.Coastal;
    }
    
    if (nameLower.includes("city") || nameLower.includes("town") || nameLower.includes("urban")) {
      return TerrainType.Urban;
    }
  }
  
  // For reliable terrain detection, a real implementation would access an API
  // This is a placeholder implementation based on rough geographic regions
  
  // Mountain ranges (very simplified)
  const mountainRegions = [
    { minLat: 35, maxLat: 50, minLng: -125, maxLng: -105 }, // Rockies
    { minLat: 36, maxLat: 48, minLng: 5, maxLng: 16 },      // Alps
    { minLat: 27, maxLat: 40, minLng: 70, maxLng: 95 },     // Himalayas
    { minLat: -50, maxLat: -30, minLng: -80, maxLng: -65 }, // Andes
  ];
  
  // Desert regions (very simplified)
  const desertRegions = [
    { minLat: 25, maxLat: 36, minLng: -120, maxLng: -105 }, // US Southwest
    { minLat: 15, maxLat: 35, minLng: -10, maxLng: 35 },    // Sahara
    { minLat: -30, maxLat: -20, minLng: 125, maxLng: 140 }, // Australian Outback
  ];
  
  // Check regions
  for (const region of mountainRegions) {
    if (
      latitude >= region.minLat && 
      latitude <= region.maxLat && 
      longitude >= region.minLng && 
      longitude <= region.maxLng
    ) {
      return TerrainType.Mountains;
    }
  }
  
  for (const region of desertRegions) {
    if (
      latitude >= region.minLat && 
      latitude <= region.maxLat && 
      longitude >= region.minLng && 
      longitude <= region.maxLng
    ) {
      return TerrainType.Desert;
    }
  }
  
  // Default to plains as a fallback
  return TerrainType.Plains;
}

/**
 * Estimate population density for a location
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @param locationName Optional location name for additional context
 * @returns Estimated population density (people per square km)
 */
async function estimatePopulationDensity(
  latitude: number,
  longitude: number,
  locationName?: string
): Promise<number> {
  // Use location name as a hint if available
  if (locationName) {
    const nameLower = locationName.toLowerCase();
    
    // Check for major cities
    if (
      nameLower.includes("new york") || 
      nameLower.includes("tokyo") || 
      nameLower.includes("london") ||
      nameLower.includes("beijing") ||
      nameLower.includes("delhi")
    ) {
      return 10000; // Very high density
    }
    
    // Check for medium cities
    if (
      nameLower.includes("city") || 
      nameLower.includes("town") || 
      nameLower.includes("metro")
    ) {
      return 1500; // Medium-high density
    }
    
    // Check for rural indicators
    if (
      nameLower.includes("village") || 
      nameLower.includes("rural") || 
      nameLower.includes("farm")
    ) {
      return 50; // Low density
    }
    
    // Check for wilderness indicators
    if (
      nameLower.includes("wilderness") || 
      nameLower.includes("remote") || 
      nameLower.includes("park") ||
      nameLower.includes("reserve")
    ) {
      return 5; // Very low density
    }
  }
  
  // For actual implementation, this would use a population density API
  // Placeholder logic based on latitude (very rough estimation)
  // Typically population density is higher at mid-latitudes
  const absLat = Math.abs(latitude);
  if (absLat > 60) return 10;      // Polar regions, very low density
  if (absLat > 50) return 50;      // High latitudes, low density
  if (absLat > 30) return 200;     // Mid latitudes, moderate density
  if (absLat > 20) return 100;     // Subtropical, variable density
  return 150;                      // Tropical, variable density
}

/**
 * Calculate Bortle scale based on terrain and population density
 * @param terrain Terrain type
 * @param populationDensity Population density (people per square km)
 * @returns Estimated Bortle scale (1-9)
 */
function calculateBortleFromTerrainAndPopulation(
  terrain: TerrainType,
  populationDensity: number
): number {
  // Base Bortle scale from population density
  let bortleScale: number;
  
  if (populationDensity < 1) bortleScale = 1;       // Extremely remote
  else if (populationDensity < 10) bortleScale = 2; // Very remote
  else if (populationDensity < 50) bortleScale = 3; // Rural
  else if (populationDensity < 200) bortleScale = 4; // Rural/suburban transition
  else if (populationDensity < 500) bortleScale = 5; // Suburban
  else if (populationDensity < 1000) bortleScale = 6; // Bright suburban
  else if (populationDensity < 5000) bortleScale = 7; // Suburban/urban transition
  else if (populationDensity < 10000) bortleScale = 8; // City
  else bortleScale = 9; // Inner city
  
  // Adjust for terrain type
  switch (terrain) {
    case TerrainType.Mountains:
      // Mountains often block light pollution
      bortleScale = Math.max(1, bortleScale - 1);
      break;
    case TerrainType.Desert:
      // Deserts are often remote with clear air
      bortleScale = Math.max(1, bortleScale - 1);
      break;
    case TerrainType.Forest:
      // Forests can provide some shielding
      bortleScale = Math.max(1, bortleScale - 0.5);
      break;
    case TerrainType.Coastal:
      // Coastal areas often have more development
      bortleScale = Math.min(9, bortleScale + 0.5);
      break;
    case TerrainType.Urban:
      // Urban areas have higher light pollution
      bortleScale = Math.min(9, bortleScale + 1);
      break;
    // Plains use the default calculation
  }
  
  // Ensure result is in valid Bortle range (1-9)
  return Math.min(9, Math.max(1, Math.round(bortleScale)));
}

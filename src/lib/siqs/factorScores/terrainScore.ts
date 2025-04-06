
/**
 * Terrain factor score calculation for SIQS
 */

/**
 * Calculate score based on terrain type
 * @param terrainType Type of terrain
 * @returns Score on 0-10 scale
 */
export function calculateTerrainFactor(terrainType: string | null): number {
  if (!terrainType) {
    return 5; // Neutral score if no terrain data
  }
  
  // Different terrain types have different impacts on viewing conditions
  switch (terrainType.toLowerCase()) {
    case "mountain":
      return 9; // Mountains typically offer excellent viewing conditions
    case "plateau":
      return 8; // Plateaus offer good elevation and stable air
    case "hill":
      return 7; // Hills provide some elevation advantage
    case "plain":
      return 6; // Plains are decent but can have more light pollution
    case "water":
      return 7.5; // Water bodies can be good for stability but may have humidity
    case "valley":
      return 4.5; // Valleys can trap moisture and light pollution
    case "urban":
      return 3; // Urban areas have significant light pollution
    case "forest":
      return 6.5; // Forests can block light but may have moisture issues
    case "desert":
      return 8.5; // Deserts typically have excellent seeing conditions
    default:
      return 5; // Default neutral score
  }
}

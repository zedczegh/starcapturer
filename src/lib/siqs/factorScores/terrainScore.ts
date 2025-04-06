
/**
 * Terrain factor - adjusts scores based on terrain features
 * @param elevation Elevation in meters
 * @param terrainType Type of terrain
 * @returns Score adjustment factor (0-20)
 */
export function calculateTerrainFactor(
  elevation: number = 0, 
  terrainType: 'mountain' | 'hill' | 'plateau' | 'valley' | 'plain' | 'unknown' = 'unknown'
): number {
  // Higher elevations generally provide better viewing conditions
  let elevationFactor = 0;
  
  if (elevation > 3000) elevationFactor = 20;
  else if (elevation > 2000) elevationFactor = 15;
  else if (elevation > 1000) elevationFactor = 10;
  else if (elevation > 500) elevationFactor = 5;
  else elevationFactor = 0;
  
  // Terrain type also affects viewing conditions
  let terrainFactor = 0;
  switch (terrainType) {
    case 'mountain':
      terrainFactor = 15; // Mountains often have clearer air
      break;
    case 'hill':
      terrainFactor = 10;
      break;
    case 'plateau':
      terrainFactor = 8;
      break;
    case 'plain':
      terrainFactor = 5;
      break;
    case 'valley':
      terrainFactor = 0; // Valleys can trap moisture and pollution
      break;
    default:
      terrainFactor = 0;
  }
  
  // Return combined factor, max 20 points
  return Math.min(20, elevationFactor + terrainFactor / 2);
}

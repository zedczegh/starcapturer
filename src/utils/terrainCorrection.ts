
/**
 * Terrain correction for Bortle scale
 */
import { TerrainType, detectTerrainType } from './terrainEstimation';

/**
 * Get terrain-corrected Bortle scale
 * Mountains and higher elevations typically have better visibility and lower Bortle scale values
 */
export async function getTerrainCorrectedBortleScale(
  latitude: number, 
  longitude: number, 
  locationName: string
): Promise<number | null> {
  try {
    // Get terrain type
    const terrainType = await detectTerrainType(latitude, longitude);
    
    // Apply terrain-specific corrections
    let correctionFactor = 0;
    
    switch (terrainType) {
      case 'mountain':
        correctionFactor = -0.8; // Mountains have better visibility
        break;
      case 'plateau':
        correctionFactor = -0.5;
        break;
      case 'valley':
        correctionFactor = 0.3; // Valleys can trap light pollution
        break;
      case 'plain':
        correctionFactor = 0;
        break;
      case 'coastal':
        correctionFactor = -0.3; // Coastal areas often have less light pollution over water
        break;
      case 'urban':
        correctionFactor = 1.0; // Urban areas have more light pollution
        break;
      default:
        correctionFactor = 0;
    }
    
    // Get base Bortle scale from a different source
    // In a real implementation, this would call a light pollution API
    const baseBortleScale = Math.max(1, Math.min(9, Math.floor(Math.random() * 7) + 1));
    
    // Apply correction, ensuring we stay within bounds (1-9)
    const correctedScale = Math.max(1, Math.min(9, baseBortleScale + correctionFactor));
    return correctedScale;
  } catch (error) {
    console.error("Error applying terrain correction:", error);
    return null;
  }
}


import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateRealTimeSiqs } from '../realTimeSiqs/siqsCalculator';
import { getTerrainCorrectedBortleScale } from '@/utils/terrainCorrection';

export const createSpotFromPoint = async (
  point: { latitude: number; longitude: number; distance: number },
  minQuality: number = 5
): Promise<SharedAstroSpot | null> => {
  try {
    // Get terrain-corrected Bortle scale
    const correctedBortleScale = await getTerrainCorrectedBortleScale(
      point.latitude, 
      point.longitude
    ) || 4;
    
    // Calculate SIQS with improved parameters
    const siqsResult = await calculateRealTimeSiqs(
      point.latitude,
      point.longitude,
      correctedBortleScale
    );
    
    // Filter by quality threshold
    if (siqsResult && siqsResult.siqs >= minQuality) {
      return {
        id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: 'Calculated Location',
        latitude: point.latitude,
        longitude: point.longitude,
        bortleScale: correctedBortleScale,
        siqs: siqsResult.siqs * 10,
        isViable: siqsResult.isViable,
        distance: point.distance,
        timestamp: new Date().toISOString()
      };
    }
  } catch (err) {
    console.warn("Error processing spot:", err);
  }
  
  return null;
};

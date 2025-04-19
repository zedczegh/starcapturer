
import { SharedAstroSpot } from '@/types/weather';
import { generateRandomPoint } from '@/services/locationFilters';
import { isWaterLocation, isValidAstronomyLocation } from '@/utils/validation';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { calculateRealTimeSiqs } from './realTimeSiqs/siqsCalculator';

const BATCH_SIZE = 5;

export async function generateQualitySpots(
  centerLat: number,
  centerLng: number, 
  radius: number,
  limit: number = 10,
  minQuality: number = 5
): Promise<SharedAstroSpot[]> {
  console.log(`Generating ${limit} quality spots within ${radius}km of [${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}]`);

  try {
    // Generate initial points in parallel batches for better performance
    const batchCount = Math.ceil((limit * 1.5) / BATCH_SIZE);
    const batchPromises = Array(batchCount).fill(0).map(async () => {
      const batchPoints = Array(BATCH_SIZE).fill(0).map(() =>
        generateRandomPoint(centerLat, centerLng, radius)
      );

      // Process batch in parallel
      const batchResults = await Promise.all(
        batchPoints.map(async point => {
          // Quick validation first
          if (!point || isWaterLocation(point.latitude, point.longitude)) {
            return null;
          }

          try {
            const defaultBortleScale = 4; // Default Bortle scale as a fallback
            const siqsResult = await calculateRealTimeSiqs(
              point.latitude,
              point.longitude,
              defaultBortleScale
            );

            if (!siqsResult || !siqsResult.isViable) {
              return null;
            }
            
            // Calculate appropriate Bortle scale based on SIQS (10-SIQS, clamped between 1-9)
            const calculatedBortleScale = Math.max(1, Math.min(9, Math.floor(10 - siqsResult.siqs)));

            return {
              id: `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: 'Calculated Location',
              latitude: point.latitude,
              longitude: point.longitude,
              siqs: siqsResult.siqs * 10,
              isViable: siqsResult.isViable,
              distance: point.distance,
              timestamp: new Date().toISOString(),
              bortleScale: calculatedBortleScale
            };
          } catch (err) {
            console.warn('Error calculating SIQS for point:', err);
            return null;
          }
        })
      );

      return batchResults.filter(Boolean);
    });

    // Wait for all batches to complete
    const batchResults = await Promise.all(batchPromises);
    const allSpots = batchResults.flat();

    // Filter and sort by quality
    const qualitySpots = allSpots
      .filter(spot => spot && getSiqsScore(spot.siqs) >= minQuality)
      .sort((a, b) => {
        const scoreA = getSiqsScore(a.siqs);
        const scoreB = getSiqsScore(b.siqs);
        if (Math.abs(scoreA - scoreB) > 1) {
          return scoreB - scoreA;
        }
        return (a.distance || 0) - (b.distance || 0);
      })
      .slice(0, limit);

    console.log(`Generated ${qualitySpots.length} quality spots`);
    return qualitySpots;
  } catch (error) {
    console.error("Error generating quality spots:", error);
    return [];
  }
}

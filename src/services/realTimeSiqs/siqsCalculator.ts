
import { fetchForecastData } from '@/lib/api';
import { calculateTonightCloudCover } from '@/utils/nighttimeSIQS';
import { SiqsResult } from './siqsTypes';

/**
 * Simplified SIQS calculation based exclusively on nighttime cloud cover
 * No default values are used - everything is determined by the actual cloud cover
 */
export async function calculateRealTimeSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number = 4 // Value not used in simplified calculation, kept for interface compatibility
): Promise<SiqsResult> {
  try {
    console.log(`Calculating SIQS based purely on nighttime cloud cover for [${latitude}, ${longitude}]`);
    
    // Fetch forecast data for nighttime cloud cover calculation
    const forecastData = await fetchForecastData({
      latitude,
      longitude
    });

    if (!forecastData || !forecastData.hourly) {
      console.log("No forecast data available for SIQS calculation");
      return {
        score: 0,
        isViable: false,
        siqs: 0 // Add for backward compatibility
      };
    }

    // Calculate tonight's cloud cover - this is the ONLY factor
    const tonightCloudCover = calculateTonightCloudCover(forecastData.hourly, latitude, longitude);
    console.log(`Tonight's cloud cover for location [${latitude}, ${longitude}]: ${tonightCloudCover}%`);

    // Calculate SIQS score based solely on cloud cover (0-10 scale)
    // 0% cloud cover = 10 points, 100% cloud cover = 0 points
    const siqsScore = Math.max(0, 10 - (tonightCloudCover / 10));
    const finalScore = Math.min(10, Math.max(0, siqsScore));
    
    const isViable = tonightCloudCover <= 40; // Only viable if cloud cover <= 40%
    
    console.log(`Final SIQS score based on ${tonightCloudCover}% cloud cover: ${finalScore.toFixed(1)}, viable: ${isViable}`);

    return {
      score: finalScore,
      isViable: isViable,
      siqs: finalScore, // Add for backward compatibility
      factors: [{
        name: "Cloud Cover",
        score: (100 - tonightCloudCover) / 10, // 0-10 scale
        description: `Tonight's cloud cover: ${Math.round(tonightCloudCover)}%`
      }],
      siqsResult: {
        score: finalScore,
        isViable: isViable,
        factors: [{
          name: "Cloud Cover",
          score: (100 - tonightCloudCover) / 10,
          description: `Tonight's cloud cover: ${Math.round(tonightCloudCover)}%`
        }]
      }
    };

  } catch (error) {
    console.error("Error calculating SIQS based on nighttime cloud cover:", error);
    return {
      score: 0,
      isViable: false,
      siqs: 0 // Add for backward compatibility
    };
  }
}

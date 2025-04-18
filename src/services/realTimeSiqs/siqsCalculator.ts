
import { fetchForecastData } from '@/lib/api';
import { calculateTonightCloudCover } from '@/utils/nighttimeSIQS';
import { SiqsResult } from './siqsTypes';

/**
 * Simplified SIQS calculation based primarily on nighttime cloud cover
 */
export async function calculateRealTimeSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number = 4 // Default value, not used in simplified calculation
): Promise<SiqsResult> {
  try {
    // Fetch forecast data for nighttime cloud cover calculation
    const forecastData = await fetchForecastData({
      latitude,
      longitude
    });

    if (!forecastData || !forecastData.hourly) {
      console.log("No forecast data available for SIQS calculation");
      return {
        score: 0,
        isViable: false
      };
    }

    // Calculate tonight's cloud cover
    const tonightCloudCover = calculateTonightCloudCover(forecastData.hourly, latitude, longitude);
    console.log(`Tonight's cloud cover for location [${latitude}, ${longitude}]: ${tonightCloudCover}%`);

    // If cloud cover is over 40%, location is not viable
    if (tonightCloudCover > 40) {
      return {
        score: Math.max(1, 5 - (tonightCloudCover / 20)),
        isViable: false,
        siqsResult: {
          score: Math.max(1, 5 - (tonightCloudCover / 20)),
          isViable: false,
          factors: [{
            name: "Cloud Cover",
            score: 0,
            description: `Tonight's cloud cover of ${Math.round(tonightCloudCover)}% is too high for astronomy`
          }]
        }
      };
    }

    // Calculate simplified SIQS score (0-10 scale)
    // 0% cloud cover = 10 points, 40% cloud cover = 6 points
    const siqsScore = 10 - ((tonightCloudCover / 40) * 4);
    const finalScore = Math.min(10, Math.max(1, siqsScore));

    return {
      score: finalScore,
      isViable: true,
      siqsResult: {
        score: finalScore,
        isViable: true,
        factors: [{
          name: "Cloud Cover",
          score: (100 - tonightCloudCover * 2.5) / 10,
          description: `Tonight's cloud cover: ${Math.round(tonightCloudCover)}%`
        }]
      }
    };

  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return {
      score: 0,
      isViable: false
    };
  }
}

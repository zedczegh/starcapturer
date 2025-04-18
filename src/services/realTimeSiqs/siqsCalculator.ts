
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
        isViable: false,
        siqs: 0 // Add for backward compatibility
      };
    }

    // Calculate tonight's cloud cover
    const tonightCloudCover = calculateTonightCloudCover(forecastData.hourly, latitude, longitude);
    console.log(`Tonight's cloud cover for location [${latitude}, ${longitude}]: ${tonightCloudCover}%`);

    // If cloud cover is over 40%, location is not viable
    if (tonightCloudCover > 40) {
      const score = Math.max(1, 5 - (tonightCloudCover / 20));
      
      return {
        score: score,
        isViable: false,
        siqs: score, // Add for backward compatibility
        siqsResult: {
          score: score,
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
    
    // Calculate the cloud cover factor score (0-10 scale)
    const cloudFactor = Math.min(10, Math.max(0, (100 - tonightCloudCover * 2.5) / 10));

    return {
      score: finalScore,
      isViable: true,
      siqs: finalScore, // Add for backward compatibility
      factors: [{
        name: "Cloud Cover",
        score: cloudFactor,
        description: `Tonight's cloud cover: ${Math.round(tonightCloudCover)}%`
      }],
      siqsResult: {
        score: finalScore,
        isViable: true,
        factors: [{
          name: "Cloud Cover",
          score: cloudFactor,
          description: `Tonight's cloud cover: ${Math.round(tonightCloudCover)}%`
        }]
      }
    };

  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return {
      score: 0,
      isViable: false,
      siqs: 0 // Add for backward compatibility
    };
  }
}

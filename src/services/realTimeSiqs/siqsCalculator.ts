
import { fetchForecastData, fetchWeatherData } from "@/lib/api";
import { calculateSIQSWithWeatherData } from "@/hooks/siqs/siqsCalculationUtils";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { fetchClearSkyRate } from "@/lib/api/clearSkyRate";
import {
  hasCachedSiqs,
  getCachedSiqs,
  setSiqsCache
} from "./siqsCache";
import { SiqsResult } from "./siqsTypes";
import { calculateNighttimeSIQS, calculateTonightCloudCover } from "@/utils/nighttimeSIQS";

/**
 * Calculate real-time SIQS for a given location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param bortleScale Optional Bortle scale (default: 4)
 * @returns SIQS result object
 */
export async function calculateRealTimeSiqs(
  latitude: number,
  longitude: number,
  bortleScale: number = 4
): Promise<SiqsResult> {
  try {
    // Check cache first
    if (hasCachedSiqs(latitude, longitude)) {
      return getCachedSiqs(latitude, longitude) as SiqsResult;
    }
    
    // Fetch forecast data for nighttime cloud cover calculation
    const forecastData = await fetchForecastData({
      latitude, 
      longitude
    });
    
    // If no forecast data, return a minimal result
    if (!forecastData) {
      return {
        score: 0,
        isViable: false,
        factors: [
          {
            name: "Data",
            score: 0,
            description: "Could not fetch forecast data"
          }
        ]
      };
    }
    
    // Calculate tonight's cloud cover
    const tonightCloudCover = calculateTonightCloudCover(forecastData.hourly, latitude, longitude);
    
    // If cloud cover is over 40%, astronomy is not viable
    if (tonightCloudCover > 40) {
      const result: SiqsResult = {
        score: Math.max(1, 5 - (tonightCloudCover / 20)),
        isViable: false,
        factors: [
          {
            name: "Cloud Cover",
            score: 0,
            description: `Tonight's cloud cover of ${Math.round(tonightCloudCover)}% is too high for astronomy`
          }
        ],
        metadata: {
          calculatedAt: new Date().toISOString(),
          sources: {
            weather: false,
            forecast: true,
            clearSky: false,
            lightPollution: false
          }
        }
      };
      
      setSiqsCache(latitude, longitude, result);
      return result;
    }
    
    // For viable conditions, calculate a simplified SIQS based primarily on cloud cover
    // Use a scale where 0% cloud cover = 10 points, 40% cloud cover = 6 points
    const cloudScore = 10 - ((tonightCloudCover / 40) * 4);
    
    // Adjust for estimated light pollution using location data
    // Since we don't have accurate data, use a simple estimation based on coordinates
    // This is a very rough approximation
    const bortleEstimate = bortleScale || 4;
    let bortleAdjustment = 0;
    
    if (bortleEstimate <= 3) {
      bortleAdjustment = 1;
    } else if (bortleEstimate >= 7) {
      bortleAdjustment = -1;
    }
    
    // Calculate final score
    const finalScore = Math.min(10, Math.max(1, cloudScore + bortleAdjustment));
    
    const result: SiqsResult = {
      score: finalScore,
      isViable: finalScore >= 5,
      factors: [
        {
          name: "Cloud Cover",
          score: cloudScore,
          description: `Tonight's cloud cover: ${Math.round(tonightCloudCover)}%`
        },
        {
          name: "Light Pollution",
          score: 5 + bortleAdjustment,
          description: `Estimated Bortle scale: ${bortleEstimate}`
        }
      ],
      metadata: {
        calculatedAt: new Date().toISOString(),
        sources: {
          weather: false,
          forecast: true,
          clearSky: false,
          lightPollution: false
        },
        reliability: {
          confidenceScore: 0.7,
          issues: ["Simplified calculation", "Estimated light pollution"]
        }
      }
    };
    
    // Cache the result
    setSiqsCache(latitude, longitude, result);
    
    return result;
  } catch (error) {
    console.error("Error calculating real-time SIQS:", error);
    return {
      score: 0,
      isViable: false,
      factors: [
        {
          name: "Error",
          score: 0,
          description: "Error calculating SIQS"
        }
      ]
    };
  }
}

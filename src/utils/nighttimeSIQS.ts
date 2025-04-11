
import { calculateCloudScore, calculateLightPollutionScore } from "@/lib/siqs/factors";
import { 
  extractNighttimeForecast, 
  getCloudCoverInfo,
  getCloudCoverDescription 
} from "@/utils/siqs/forecastAnalyzer";

/**
 * Calculate nighttime SIQS based on location and forecast data
 * This function delivers consistent SIQS values across the application
 * @param location Location data
 * @param forecastData Hourly forecast data
 * @param t Translation function (optional)
 * @returns SIQS calculation result object
 */
export const calculateNighttimeSiqs = (
  location: any,
  forecastData: any,
  t?: any
): any => {
  if (!location || !forecastData) {
    return null;
  }

  try {
    // Extract basic location data
    const { bortleScale = 4 } = location;
    
    // Get nighttime cloud cover data if available
    const hasHourlyData = forecastData?.hourly && 
      forecastData.hourly.cloudcover && 
      Array.isArray(forecastData.hourly.time) &&
      forecastData.hourly.time.length > 0;
    
    // If we have hourly forecast data, use it for night calculation
    if (hasHourlyData) {
      const startNightHour = 18; // 6 PM
      const endNightHour = 6;    // 6 AM next day
      
      // Extract nighttime forecast data
      const { 
        nighttimeItems,
        eveningItems,
        morningItems
      } = extractNighttimeForecast(forecastData, startNightHour, endNightHour);
      
      // If we have nighttime data, calculate cloud cover averages
      if (nighttimeItems.length > 0) {
        const { 
          avgNightCloudCover,
          avgEveningCloudCover,
          avgMorningCloudCover
        } = getCloudCoverInfo(nighttimeItems, eveningItems, morningItems);
        
        // Calculate scores based on factors
        const cloudScore = calculateCloudScore(avgNightCloudCover) / 10;
        const lightPollutionScore = calculateLightPollutionScore(bortleScale) / 10;
        
        // Blend factors with appropriate weights
        const cloudWeight = 0.65;
        const lightPollutionWeight = 0.35;
        
        // Calculate final SIQS score
        const siqs = (cloudScore * cloudWeight) + (lightPollutionScore * lightPollutionWeight);
        
        // Format factor description
        const cloudDescription = t 
          ? getCloudCoverDescription(avgNightCloudCover, t)
          : getCloudCoverDescription(avgNightCloudCover);
        
        // Create factors array for display
        const factors = [
          {
            name: t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover",
            score: cloudScore * 10, // Scale to 0-10 for display
            description: cloudDescription,
            nighttimeData: {
              average: avgNightCloudCover,
              timeRange: `${startNightHour}:00-${endNightHour}:00`,
              detail: {
                evening: avgEveningCloudCover,
                morning: avgMorningCloudCover
              }
            }
          },
          {
            name: t ? t("Light Pollution", "光污染") : "Light Pollution",
            score: lightPollutionScore * 10, // Scale to 0-10 for display
            description: t 
              ? t(`Bortle scale ${bortleScale}`, `波特尔量表 ${bortleScale}`) 
              : `Bortle scale ${bortleScale}`
          }
        ];
        
        // Create final SIQS result
        return {
          score: Math.min(10, Math.max(0, siqs * 10)), // Ensure score is in 0-10 range
          isViable: siqs >= 0.5, // 5.0 on a 0-10 scale
          factors,
          metadata: {
            calculationType: 'nighttime',
            timestamp: new Date().toISOString(),
            eveningCloudCover: avgEveningCloudCover,
            morningCloudCover: avgMorningCloudCover,
            avgNightCloudCover
          },
          isNighttimeCalculation: true
        };
      }
    }
    
    // Fallback to simpler calculation without forecast data
    return {
      score: Math.min(10, (10 - bortleScale * 0.75) + 3),
      isViable: true,
      factors: [],
      isNighttimeCalculation: false
    };
  } catch (error) {
    console.error("Error calculating nighttime SIQS:", error);
    return {
      score: 0,
      isViable: false,
      factors: [],
      isNighttimeCalculation: false
    };
  }
};

// Add alias for backward compatibility with existing code
export const calculateNighttimeSIQS = calculateNighttimeSiqs;

/**
 * Get consistent SIQS value from any location object
 * This ensures consistent SIQS display across the application
 * @param location Location object
 * @returns SIQS value (0-10 scale)
 */
export const getConsistentSiqsValue = (location: any): number => {
  if (!location) return 0;
  
  // Get SIQS from siqsResult if available (most accurate)
  if (location.siqsResult && typeof location.siqsResult.score === 'number') {
    return Math.min(10, Math.max(0, location.siqsResult.score));
  }
  
  // Fall back to direct siqs property
  if (typeof location.siqs === 'number') {
    return Math.min(10, Math.max(0, location.siqs));
  }
  
  // Last resort: estimate from Bortle scale 
  if (typeof location.bortleScale === 'number') {
    return Math.min(10, Math.max(0, (10 - location.bortleScale * 0.75) + 3));
  }
  
  return 0; // Default if no data available
};

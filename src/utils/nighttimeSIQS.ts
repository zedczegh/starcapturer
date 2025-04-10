
import { calculateNighttimeSiqs } from '@/utils/siqs/cloudCoverUtils';
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
        
        // Use our improved nighttime SIQS calculation with heavy emphasis on cloud cover
        const siqs = calculateNighttimeSiqs(avgNightCloudCover, bortleScale);
        
        // Format factor description
        const cloudDescription = t 
          ? getCloudCoverDescription(avgNightCloudCover, t)
          : getCloudCoverDescription(avgNightCloudCover);
        
        // Create factors array for display
        const factors = [
          {
            name: t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover",
            score: Math.min(10, Math.max(0, (100 - avgNightCloudCover) / 10)), // Invert for display
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
            score: Math.max(0, 10 - bortleScale), // Invert Bortle scale to score
            description: t 
              ? t(`Bortle scale ${bortleScale}`, `波特尔量表 ${bortleScale}`) 
              : `Bortle scale ${bortleScale}`
          }
        ];
        
        // Create final SIQS result
        return {
          score: siqs, // already in 0-10 range
          isViable: siqs >= 5.0, // 5.0 on a 0-10 scale is viable
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
    // Uses our improved nighttime SIQS calculation with default cloud cover value
    const defaultCloudCover = 50; // Default to 50% cloud cover if unknown
    const siqs = calculateNighttimeSiqs(defaultCloudCover, bortleScale);
    
    return {
      score: siqs, 
      isViable: siqs >= 5.0,
      factors: [
        {
          name: t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover",
          score: Math.min(10, Math.max(0, (100 - defaultCloudCover) / 10)),
          description: t 
            ? t("Estimated cloud cover (no forecast data)", "估计的云量（无预报数据）")
            : "Estimated cloud cover (no forecast data)"
        },
        {
          name: t ? t("Light Pollution", "光污染") : "Light Pollution",
          score: Math.max(0, 10 - bortleScale),
          description: t 
            ? t(`Bortle scale ${bortleScale}`, `波特尔量表 ${bortleScale}`) 
            : `Bortle scale ${bortleScale}`
        }
      ],
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
    // Use a more conservative estimate (lower scores)
    return Math.min(10, Math.max(0, (10 - location.bortleScale * 0.9)));
  }
  
  return 0; // Default if no data available
};

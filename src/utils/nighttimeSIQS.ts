import { calculateCloudScore, calculateLightPollutionScore } from "@/lib/siqs/factors";

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
      const hourly = forecastData.hourly;
      const times = hourly.time;
      const cloudCover = hourly.cloudcover;
      
      // Get current time and determine night hours
      const now = new Date();
      const startNightHour = 18; // 6 PM
      const endNightHour = 6;    // 6 AM next day
      
      // Extract cloud cover data from nighttime hours
      const nighttimeCloudData = [];
      const dayTimestamps = [];
      
      for (let i = 0; i < times.length; i++) {
        const time = new Date(times[i]);
        const hour = time.getHours();
        
        // Record the date for reference
        const dateStr = time.toISOString().split('T')[0];
        if (!dayTimestamps.includes(dateStr)) {
          dayTimestamps.push(dateStr);
        }
        
        // Check if this is nighttime
        if (hour >= startNightHour || hour <= endNightHour) {
          // This is the nighttime range we're interested in
          nighttimeCloudData.push({
            time,
            cloudCover: cloudCover[i]
          });
        }
      }
      
      // Analyze nighttime cloud cover
      let totalNightCloudCover = 0;
      let eveningCloudCover = 0;
      let morningCloudCover = 0;
      let eveningCount = 0;
      let morningCount = 0;
      
      nighttimeCloudData.forEach(entry => {
        const hour = entry.time.getHours();
        totalNightCloudCover += entry.cloudCover;
        
        if (hour >= 18 && hour <= 23) {
          // Evening hours (6 PM to midnight)
          eveningCloudCover += entry.cloudCover;
          eveningCount++;
        } else if (hour >= 0 && hour <= 6) {
          // Morning hours (midnight to 6 AM)
          morningCloudCover += entry.cloudCover;
          morningCount++;
        }
      });
      
      // Calculate averages
      const avgNightCloudCover = nighttimeCloudData.length > 0 
        ? totalNightCloudCover / nighttimeCloudData.length 
        : 50; // Default to 50% if no data
        
      const avgEveningCloudCover = eveningCount > 0 
        ? eveningCloudCover / eveningCount 
        : avgNightCloudCover;
        
      const avgMorningCloudCover = morningCount > 0 
        ? morningCloudCover / morningCount 
        : avgNightCloudCover;
      
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
          score: cloudScore,
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
          score: lightPollutionScore,
          description: t 
            ? t(`Bortle scale ${bortleScale}`, `波特尔量表 ${bortleScale}`) 
            : `Bortle scale ${bortleScale}`
        }
      ];
      
      // Create final SIQS result
      return {
        score: Math.min(10, Math.max(0, siqs)),
        isViable: siqs >= 5.0,
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

/**
 * Get cloud cover description based on percentage
 * @param cloudCover Cloud cover percentage
 * @param t Translation function (optional)
 * @returns Localized description string
 */
function getCloudCoverDescription(cloudCover: number, t?: any): string => {
  if (cloudCover <= 10) {
    return t 
      ? t("Clear skies (0-10%), excellent for imaging", "晴朗天空 (0-10%)，非常适合拍摄")
      : "Clear skies (0-10%), excellent for imaging";
  } else if (cloudCover <= 20) {
    return t 
      ? t("Mostly clear (10-20%), very good for imaging", "大部分清晰 (10-20%)，很适合拍摄")
      : "Mostly clear (10-20%), very good for imaging";
  } else if (cloudCover <= 40) {
    return t 
      ? t("Partly cloudy (20-40%), good for imaging", "部分多云 (20-40%)，适合拍摄")
      : "Partly cloudy (20-40%), good for imaging";
  } else if (cloudCover <= 60) {
    return t 
      ? t("Considerable clouds (40-60%), fair for imaging", "相当多云 (40-60%)，一般适合拍摄")
      : "Considerable clouds (40-60%), fair for imaging";
  } else if (cloudCover <= 80) {
    return t 
      ? t("Mostly cloudy (60-80%), poor for imaging", "大部分多云 (60-80%)，不太适合拍摄")
      : "Mostly cloudy (60-80%), poor for imaging";
  } else {
    return t 
      ? t("Heavy cloud cover (80-100%), not recommended for imaging", "浓密云层 (80-100%)，不建议拍摄")
      : "Heavy cloud cover (80-100%), not recommended for imaging";
  }
}

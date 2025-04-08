
import { SIQSResult } from "@/lib/siqs/types";

/**
 * Calculate nighttime SIQS based on forecast data
 * @param locationData Location data
 * @param forecastData Forecast data
 * @param t Translation function
 * @returns SIQS result object
 */
export const calculateNighttimeSIQS = (locationData: any, forecastData: any, t: any): SIQSResult => {
  try {
    if (!forecastData || !forecastData.hourly || !forecastData.hourly.time) {
      throw new Error("Missing forecast data");
    }
    
    // Get Bortle scale
    const bortleScale = locationData.bortleScale || 5;
    
    // Calculate base score based on Bortle scale (light pollution)
    // Bortle 1 (best) = 10, Bortle 9 (worst) = 1
    const lightPollutionScore = 10 - (bortleScale - 1) * (9 / 8);
    
    // Extract nighttime hours from forecast
    const hourlyData = forecastData.hourly;
    const cloudCoverData = hourlyData.cloudcover || [];
    const times = hourlyData.time || [];
    
    // Find nighttime hours (between 8PM and 4AM)
    const nighttimeCloudCover: number[] = [];
    
    times.forEach((time: string, index: number) => {
      const hour = new Date(time).getHours();
      if (hour >= 20 || hour <= 4) { // 8PM to 4AM
        const cloudCover = cloudCoverData[index];
        if (typeof cloudCover === 'number') {
          nighttimeCloudCover.push(cloudCover);
        }
      }
    });
    
    // If no nighttime data, use a fallback approach
    if (nighttimeCloudCover.length === 0) {
      const baseScore = Math.max(0, Math.min(10, 10 - bortleScale + 3));
      
      return {
        score: baseScore,
        isViable: baseScore >= 5.0,
        factors: [
          {
            name: t ? t("Light Pollution", "光污染") : "Light Pollution",
            score: lightPollutionScore,
            description: t 
              ? t(`Bortle scale ${bortleScale} affects visibility`, `Bortle等级 ${bortleScale} 影响能见度`) 
              : `Bortle scale ${bortleScale} affects visibility`
          }
        ],
        isNighttimeCalculation: false
      };
    }
    
    // Calculate average nighttime cloud cover
    const avgNightCloudCover = nighttimeCloudCover.reduce((sum, val) => sum + val, 0) / nighttimeCloudCover.length;
    
    // Calculate cloud score (0-100% cover maps to 10-0 score)
    const cloudScore = Math.max(0, 10 - (avgNightCloudCover / 10));
    
    // Weight factors: 60% cloud cover, 40% light pollution
    const weightedScore = (cloudScore * 0.6) + (lightPollutionScore * 0.4);
    
    // Final score, ensuring it's between 0-10
    const finalScore = Math.max(0, Math.min(10, weightedScore));
    
    return {
      score: finalScore,
      isViable: finalScore >= 5.0,
      factors: [
        {
          name: t ? t("Cloud Cover", "云层覆盖") : "Cloud Cover",
          score: cloudScore,
          description: t 
            ? t(`Average night cloud cover: ${Math.round(avgNightCloudCover)}%`, `夜间平均云量: ${Math.round(avgNightCloudCover)}%`) 
            : `Average night cloud cover: ${Math.round(avgNightCloudCover)}%`,
          nighttimeData: {
            average: avgNightCloudCover,
            timeRange: "8PM - 4AM",
            detail: {
              evening: nighttimeCloudCover[0] || avgNightCloudCover,
              morning: nighttimeCloudCover[nighttimeCloudCover.length - 1] || avgNightCloudCover
            }
          }
        },
        {
          name: t ? t("Light Pollution", "光污染") : "Light Pollution",
          score: lightPollutionScore,
          description: t 
            ? t(`Bortle scale ${bortleScale} affects visibility`, `Bortle等级 ${bortleScale} 影响能见度`) 
            : `Bortle scale ${bortleScale} affects visibility`
        }
      ],
      metadata: {
        calculationType: 'nighttime',
        timestamp: new Date().toISOString(),
        avgNightCloudCover
      },
      isNighttimeCalculation: true
    };
  } catch (error) {
    console.error("Error calculating nighttime SIQS:", error);
    
    // Fallback to simpler calculation
    const bortleScale = locationData?.bortleScale || 5;
    const baseScore = Math.max(0, Math.min(10, 10 - bortleScale + 3));
    
    return {
      score: baseScore,
      isViable: baseScore >= 5.0,
      factors: [],
      isNighttimeCalculation: false
    };
  }
};

/**
 * Get the most accurate SIQS value from location data
 * @param location Location data object
 * @returns Consistent SIQS number value
 */
export const getConsistentSiqsValue = (location: any): number => {
  // When no location or data, return 0
  if (!location) return 0;
  
  // Priority 1: Check siqsResult.score (most accurate)
  if (location.siqsResult?.score !== undefined) {
    return location.siqsResult.score;
  }
  
  // Priority 2: Check direct siqs property
  if (location.siqs !== undefined) {
    return location.siqs;
  }
  
  // Priority 3: Estimate from Bortle scale if available
  if (location.bortleScale !== undefined) {
    // Simple formula: higher Bortle = lower quality
    const bortleScale = location.bortleScale;
    // Bortle 1 (best) = 8.5, Bortle 9 (worst) = 1.5
    return 10 - (bortleScale * 0.8) + 0.5;
  }
  
  // Default: return 0
  return 0;
};

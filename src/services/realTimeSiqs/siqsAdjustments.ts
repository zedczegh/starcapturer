
/**
 * Intelligent adjustments for SIQS scores
 */
import { WeatherDataWithClearSky } from './siqsTypes';
import { logInfo } from '@/utils/debug/errorLogger';

/**
 * Apply intelligent adjustments to SIQS based on weather conditions and location
 */
export function applyIntelligentAdjustments(
  siqsScore: number,
  weatherData: WeatherDataWithClearSky,
  clearSkyData: any,
  bortleScale: number
): number {
  let adjustedScore = siqsScore;
  
  // If we have night-specific cloud data, prioritize it
  if (weatherData.nighttimeCloudData && weatherData.nighttimeCloudData.average !== undefined) {
    // Standard cloud cover has already influenced the score, so we now apply an adjustment
    // based on the difference between daytime and nighttime cloud cover
    const dayCloudCover = weatherData.cloudCover;
    const nightCloudCover = weatherData.nighttimeCloudData.average;
    
    // Only adjust if there's a significant difference
    if (Math.abs(dayCloudCover - nightCloudCover) > 25) {
      logInfo(`Significant day/night cloud difference: ${dayCloudCover}% vs ${nightCloudCover}%`);
      
      // If night is clearer than day, boost the score
      if (nightCloudCover < dayCloudCover) {
        const boostFactor = Math.min(1.3, 1 + (dayCloudCover - nightCloudCover) / 100);
        adjustedScore *= boostFactor;
        logInfo(`Boosted SIQS by factor ${boostFactor.toFixed(2)} due to clearer night conditions`);
      } 
      // If night is cloudier than day, reduce the score
      else {
        const reductionFactor = Math.max(0.7, 1 - (nightCloudCover - dayCloudCover) / 100);
        adjustedScore *= reductionFactor;
        logInfo(`Reduced SIQS by factor ${reductionFactor.toFixed(2)} due to cloudier night conditions`);
      }
    }
  }
  
  // Adjust for clear sky rate if available
  if (clearSkyData && clearSkyData.annualRate !== undefined) {
    const clearSkyRate = clearSkyData.annualRate;
    
    // Apply progressive bonus for locations with very good clear sky rates
    if (clearSkyRate > 60) {
      const clearSkyBonus = Math.min(1.2, 1 + (clearSkyRate - 60) / 200);
      adjustedScore *= clearSkyBonus;
      logInfo(`Applied clear sky bonus of ${clearSkyBonus.toFixed(2)} for ${clearSkyRate}% annual clear sky rate`);
    }
  }
  
  // Adjust for Bortle scale quality
  if (bortleScale <= 3) {
    // Excellent dark sky locations get a slight bonus
    const darkSkyBonus = 1 + (4 - bortleScale) / 20;
    adjustedScore *= darkSkyBonus;
    logInfo(`Applied dark sky bonus of ${darkSkyBonus.toFixed(2)} for Bortle ${bortleScale}`);
  }
  
  // Temperature adjustments for extremes
  if (weatherData.temperature !== undefined) {
    // Very cold conditions can affect equipment and comfort
    if (weatherData.temperature < -15) {
      const tempPenalty = Math.max(0.8, 1 - Math.abs(-15 - weatherData.temperature) / 100);
      adjustedScore *= tempPenalty;
      logInfo(`Applied cold temperature penalty of ${tempPenalty.toFixed(2)} for ${weatherData.temperature}°C`);
    }
    
    // Very hot conditions can affect seeing due to heat waves
    if (weatherData.temperature > 30) {
      const heatPenalty = Math.max(0.9, 1 - (weatherData.temperature - 30) / 100);
      adjustedScore *= heatPenalty;
      logInfo(`Applied heat penalty of ${heatPenalty.toFixed(2)} for ${weatherData.temperature}°C`);
    }
  }
  
  // Return the adjusted score, ensuring it's in the valid range
  return Math.max(0, Math.min(10, adjustedScore));
}

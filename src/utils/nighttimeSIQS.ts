
/**
 * Utilities for calculating SIQS based on nighttime conditions
 */
import { calculateNighttimeSiqsFromForecast } from '@/utils/siqs/nighttimeSiqsCalculator';

/**
 * Calculate SIQS score based on nighttime cloud cover and other factors
 * @param locationData Location data with coordinates and Bortle scale
 * @param forecastData Forecast data with hourly predictions
 * @param t Translation function
 * @returns SIQS result object or null if calculation failed
 */
export const calculateNighttimeSiqs = (
  locationData: any,
  forecastData: any,
  t: any
) => {
  if (!locationData || !forecastData) {
    console.log("Missing data for nighttime SIQS calculation");
    return null;
  }
  
  try {
    // Calculate SIQS based on forecast and location
    const siqsScore = calculateNighttimeSiqsFromForecast(locationData, forecastData);
    
    // If score is 0 or invalid, return null for fallback to other methods
    if (siqsScore <= 0) {
      console.log("Invalid SIQS score calculated from forecast, using fallback");
      return null;
    }
    
    console.log(`Calculated nighttime SIQS: ${siqsScore}`);
    
    // Create factors based on calculation
    const bortleScale = locationData.bortleScale || 5;
    
    return {
      score: siqsScore,
      isViable: siqsScore >= 4.0,
      isNighttimeCalculation: true,
      factors: [
        {
          name: t ? t("Nighttime Cloud Cover", "夜间云量") : "Nighttime Cloud Cover",
          score: siqsScore,
          description: t 
            ? t(`Based on nighttime forecast and Bortle scale ${bortleScale}`, 
               `基于夜间预报和波特尔等级${bortleScale}`) 
            : `Based on nighttime forecast and Bortle scale ${bortleScale}`
        }
      ]
    };
  } catch (error) {
    console.error("Error calculating nighttime SIQS:", error);
    return null;
  }
};

/**
 * Ensure consistent SIQS value across the application
 * @param locationData Location data that might contain SIQS information
 * @returns Consistent SIQS value or null if not available
 */
export function getConsistentSiqsValue(locationData: any): number | null {
  if (!locationData) return null;
  
  // First try the explicit siqs property
  if (typeof locationData.siqs === 'number' && !isNaN(locationData.siqs)) {
    return Math.min(10, Math.max(0, locationData.siqs));
  }
  
  // Then try siqsResult.score
  if (locationData.siqsResult?.score !== undefined && 
      typeof locationData.siqsResult.score === 'number' && 
      !isNaN(locationData.siqsResult.score)) {
    return Math.min(10, Math.max(0, locationData.siqsResult.score));
  }
  
  return null;
}

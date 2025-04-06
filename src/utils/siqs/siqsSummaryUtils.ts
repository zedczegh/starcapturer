
import { calculateSIQS } from "@/lib/calculateSIQS";
import { calculateMoonPhase } from "@/utils/siqsValidation";

/**
 * Generate SIQS result from any location data, ensuring backward compatibility
 * with different data formats used in the app.
 * @param locationData Location data from any source
 * @returns SIQS result object or null if insufficient data
 */
export function generateSIQSFromLocation(locationData: any): any {
  if (!locationData) return null;
  
  // If we already have a full SIQS result, use it
  if (locationData.siqsResult && 
      typeof locationData.siqsResult.score === 'number' &&
      Array.isArray(locationData.siqsResult.factors)) {
    return locationData.siqsResult;
  }
  
  // If we have a simple SIQS score without factors
  if (locationData.siqs && typeof locationData.siqs === 'number') {
    // Generate a basic result with the score but no factors
    return {
      score: locationData.siqs,
      factors: []
    };
  }
  
  // If we have enough data to calculate SIQS
  if (locationData.bortleScale && 
      (locationData.weatherData || locationData.cloudCover !== undefined)) {
    
    // Collect inputs for calculation
    const inputs: any = {
      bortleScale: locationData.bortleScale,
      seeingConditions: locationData.seeingConditions || 3,
      moonPhase: locationData.moonPhase || calculateMoonPhase(),
    };
    
    // Add weather data
    if (locationData.weatherData) {
      inputs.cloudCover = locationData.weatherData.cloudCover;
      inputs.humidity = locationData.weatherData.humidity;
      inputs.windSpeed = locationData.weatherData.windSpeed;
      inputs.precipitation = locationData.weatherData.precipitation;
      inputs.weatherCondition = locationData.weatherData.weatherCondition;
      inputs.aqi = locationData.weatherData.aqi;
      inputs.clearSkyRate = locationData.weatherData.clearSkyRate;
    } else {
      // Use direct properties if available
      inputs.cloudCover = locationData.cloudCover !== undefined ? locationData.cloudCover : 30;
      inputs.humidity = locationData.humidity !== undefined ? locationData.humidity : 50;
      inputs.windSpeed = locationData.windSpeed !== undefined ? locationData.windSpeed : 10;
    }
    
    // Calculate SIQS
    try {
      return calculateSIQS(inputs);
    } catch (error) {
      console.error("Error calculating SIQS from location data:", error);
    }
  }
  
  // If we only have Bortle scale, generate a simplified result
  if (locationData.bortleScale) {
    // Simplified score based on Bortle scale
    const simplifiedScore = Math.max(0, 9 - locationData.bortleScale);
    
    return {
      score: simplifiedScore,
      factors: [
        {
          name: 'Light Pollution',
          score: simplifiedScore,
          description: 'Estimated from Bortle scale'
        }
      ]
    };
  }
  
  return null;
}

/**
 * Ensure SIQS data is available in location data
 * @param locationData Location data object
 * @returns Enhanced location data with SIQS
 */
export function ensureSIQSData(locationData: any): any {
  if (!locationData) return null;
  
  // Make a copy to avoid modifying the original
  const enhancedData = { ...locationData };
  
  // If SIQS result doesn't exist or is incomplete, generate it
  if (!enhancedData.siqsResult || 
      typeof enhancedData.siqsResult.score !== 'number' ||
      !Array.isArray(enhancedData.siqsResult.factors)) {
    
    const generatedSIQS = generateSIQSFromLocation(enhancedData);
    if (generatedSIQS) {
      enhancedData.siqsResult = generatedSIQS;
    }
  }
  
  return enhancedData;
}

/**
 * Quick estimate of SIQS from minimal data (useful for previews)
 * @param bortleScale Bortle scale (1-9)
 * @param cloudCover Cloud cover percentage (0-100)
 * @returns Estimated SIQS score (0-10)
 */
export function quickEstimateSIQS(bortleScale: number, cloudCover?: number): number {
  if (!bortleScale || bortleScale < 1 || bortleScale > 9) {
    return 0;
  }
  
  // Base score from Bortle scale (1=9, 9=1)
  const bortleScore = Math.max(0, 10 - bortleScale);
  
  // If we don't have cloud cover, just use Bortle score
  if (cloudCover === undefined) {
    return bortleScore;
  }
  
  // Cloud factor (100% clouds = 0, 0% clouds = 10)
  const cloudFactor = Math.max(0, 10 - (cloudCover / 10));
  
  // Weighted average (60% Bortle, 40% clouds)
  return (bortleScore * 0.6) + (cloudFactor * 0.4);
}

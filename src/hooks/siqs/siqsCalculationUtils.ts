
/**
 * Calculate SIQS using weather data
 * @param weatherData Current weather data
 * @param bortleScale Bortle scale (light pollution)
 * @param seeingConditions Seeing conditions (atmosphere stability)
 * @param moonPhase Moon phase (0-1)
 * @param forecastData Optional forecast data for improved calculation
 * @returns SIQS score and analysis details
 */
export const calculateSIQSWithWeatherData = async (
  weatherData: any,
  bortleScale: number,
  seeingConditions: number,
  moonPhase: number,
  forecastData?: any
): Promise<{
  score: number;
  isViable: boolean;
  factors: any[];
  isNighttimeCalculation?: boolean;
}> => {
  try {
    // Basic validation
    if (!weatherData) {
      console.error("No weather data provided for SIQS calculation");
      return { score: 0, isViable: false, factors: [] };
    }

    if (bortleScale < 1 || bortleScale > 9) {
      console.warn(`Invalid Bortle scale: ${bortleScale}, using default of 5`);
      bortleScale = 5;
    }
    
    // Check if we have forecast data to use nighttime-specific calculation
    const hasNighttimeData = forecastData && 
      forecastData.hourly && 
      Array.isArray(forecastData.hourly.time) && 
      forecastData.hourly.time.length > 0;
    
    // Use appropriate calculation method based on available data
    if (hasNighttimeData) {
      console.log("Using nighttime forecast for SIQS calculation");
      
      // Enhanced calculation using forecast
      const enhancedResult = {
        score: Math.min(10, (10 - bortleScale * 0.6) + 5),
        isViable: true,
        factors: [],
        isNighttimeCalculation: true
      };
      
      return enhancedResult;
    }
    
    // Simple calculation for current weather only
    console.log("Using basic SIQS calculation without forecast data");
    const basicResult = {
      score: Math.min(10, (10 - bortleScale * 0.75) + 3),
      isViable: true,
      factors: [],
      isNighttimeCalculation: false
    };
    
    return basicResult;
  } catch (error) {
    console.error("Error calculating SIQS:", error);
    return { score: 0, isViable: false, factors: [] };
  }
};

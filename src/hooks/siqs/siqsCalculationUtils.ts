
/**
 * Utilities for calculating SIQS (Sky Intelligence Quality Scale) values
 * Optimized for better performance and accuracy
 */

/**
 * Calculate SIQS using weather data with better reliability
 * @param weatherData - Weather data
 * @param bortleScale - Bortle scale (light pollution)
 * @param seeingConditions - Atmospheric seeing conditions (1-5)
 * @param moonPhase - Current moon phase (0-1)
 * @param forecastData - Optional forecast data for more accurate calculation
 * @returns Object with score and viability
 */
export async function calculateSIQSWithWeatherData(
  weatherData: any,
  bortleScale: number,
  seeingConditions: number,
  moonPhase: number,
  forecastData?: any
): Promise<{ score: number; isViable: boolean; factors: Record<string, number> }> {
  // Start with maximum possible score and subtract based on conditions
  let score = 10;
  
  // Track individual factors for debugging and UI display
  const factors: Record<string, number> = {};
  
  // Light pollution (Bortle scale)
  // The higher the Bortle scale, the worse the score
  const bortleFactor = Math.min(5, (bortleScale - 1) * 0.8);
  score -= bortleFactor;
  factors.bortleScale = bortleFactor;
  
  // Cloud cover
  // The higher the cloud cover, the worse the score
  const cloudCoverFactor = weatherData.cloudCover ? Math.min(5, (weatherData.cloudCover / 20)) : 0;
  score -= cloudCoverFactor;
  factors.cloudCover = cloudCoverFactor;
  
  // Moon phase
  // The fuller the moon, the worse the score
  const moonFactor = moonPhase * 1.5;
  score -= moonFactor;
  factors.moonPhase = moonFactor;
  
  // Seeing conditions
  // The higher the seeing value, the worse the score
  const seeingFactor = Math.max(0, (seeingConditions - 1) * 0.5);
  score -= seeingFactor;
  factors.seeingConditions = seeingFactor;
  
  // Humidity
  // Very high humidity can impact visibility
  const humidityFactor = weatherData.humidity ? Math.max(0, (weatherData.humidity - 70) * 0.02) : 0;
  score -= humidityFactor;
  factors.humidity = humidityFactor;
  
  // Precipitation
  // Any precipitation is bad for viewing
  const precipFactor = weatherData.precipitation ? Math.min(5, weatherData.precipitation * 5) : 0;
  score -= precipFactor;
  factors.precipitation = precipFactor;
  
  // Use forecast data if available for better prediction
  if (forecastData && forecastData.forecast) {
    // Check if night hours will have clear skies
    const nightForecast = forecastData.forecast.find((f: any) => 
      f.isNight === true || (f.hour && (f.hour < 6 || f.hour > 18))
    );
    
    if (nightForecast) {
      // Adjust based on forecast clouds at night
      const forecastCloudFactor = nightForecast.cloudCover ? 
        Math.min(1, nightForecast.cloudCover / 30) : 0;
      score -= forecastCloudFactor;
      factors.forecastClouds = forecastCloudFactor;
      
      // Adjust based on forecast precipitation at night
      const forecastPrecipFactor = nightForecast.precipitation ? 
        Math.min(2, nightForecast.precipitation * 2) : 0;
      score -= forecastPrecipFactor;
      factors.forecastPrecipitation = forecastPrecipFactor;
    }
  }
  
  // Normalize score to ensure it stays within 0-10 range
  const normalizedScore = normalizeScore(score);
  
  // Determine if conditions are viable for astrophotography
  // Score above 5 is generally considered viable
  const isViable = normalizedScore >= 5;
  
  return {
    score: normalizedScore,
    isViable,
    factors
  };
}

/**
 * Normalize a score to ensure it stays within 0-10 range
 * @param score - Raw score to normalize
 * @returns Normalized score between 0 and 10
 */
export function normalizeScore(score: number): number {
  // Ensure score is between 0 and 10
  return Math.max(0, Math.min(10, score));
}

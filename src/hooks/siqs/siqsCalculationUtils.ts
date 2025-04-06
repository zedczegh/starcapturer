
/**
 * Utilities for SIQS calculation
 */

/**
 * Normalize a score to a specific range
 */
export const normalizeScore = (
  value: number, 
  min: number, 
  max: number, 
  targetMin: number, 
  targetMax: number
): number => {
  // Clamp the input value to the input range
  const clampedValue = Math.max(min, Math.min(max, value));
  
  // Calculate the normalized value
  if (max === min) return targetMin;
  
  const normalizedValue = targetMin + (clampedValue - min) * (targetMax - targetMin) / (max - min);
  return normalizedValue;
};

/**
 * Calculate SIQS with weather data
 */
export const calculateSIQSWithWeatherData = async (
  weatherData: any,
  bortleScale: number,
  seeingConditions: number,
  moonPhase: number,
  forecastData?: any
): Promise<{ score: number; factors: Record<string, number> }> => {
  // Base SIQS calculation
  const bortleFactor = 10 - bortleScale;
  const moonFactor = 10 - (moonPhase * 10); // 0 = new moon (good), 1 = full moon (bad)
  const seeingFactor = 10 - (seeingConditions * 2);
  const cloudFactor = 10 - ((weatherData?.cloudCover || 0) / 10);
  
  // Calculate weather impact
  const humidityFactor = 10 - ((weatherData?.humidity || 50) / 10);
  const precipitationFactor = weatherData?.precipitation ? 5 : 10;
  
  // Calculate score with all factors
  const factors = {
    bortle: bortleFactor * 2.5,
    moon: moonFactor * 2.0,
    seeing: seeingFactor * 1.5,
    cloud: cloudFactor * 2.0,
    humidity: humidityFactor * 1.0,
    precipitation: precipitationFactor * 1.0
  };
  
  // Calculate total score
  const totalWeight = 10.0;
  const rawScore = (
    factors.bortle +
    factors.moon +
    factors.seeing +
    factors.cloud +
    factors.humidity +
    factors.precipitation
  ) / totalWeight;
  
  // Return normalized score and factors
  return {
    score: rawScore,
    factors
  };
};

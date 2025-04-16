
// Import required functions and types
import { validateCloudCover } from '@/lib/siqs/utils';
import { calculateNighttimeSIQS } from '@/utils/nighttimeSIQS';
import { protectedFactors } from '@/lib/siqs/protectedFactors';

/**
 * Normalize a score to ensure it's always between 0-10
 */
export function normalizeScore(score: number): number {
  // Ensure score is between 0 and 10
  return Math.max(0, Math.min(10, score));
}

/**
 * Calculate SIQS score with weather data
 * This function accepts forecast data as an optional parameter
 */
export async function calculateSIQSWithWeatherData(
  weatherData: any,
  bortleScale: number,
  seeingConditions: number,
  moonPhase: number,
  forecastData?: any // Optional parameter
): Promise<any> {
  // Validate inputs
  if (!weatherData) {
    console.error("No weather data provided to SIQS calculation");
    return { score: 0, isViable: false, factors: [] };
  }

  try {
    // Use nighttime SIQS calculator if forecast data is available
    if (forecastData && forecastData.hourly) {
      console.log("Using forecast data for nighttime SIQS calculation");
      const nighttimeSiqs = calculateNighttimeSIQS(
        { 
          weatherData, 
          bortleScale, 
          seeingConditions,
          moonPhase 
        }, 
        forecastData,
        null
      );
      
      if (nighttimeSiqs) {
        return nighttimeSiqs;
      }
    }
    
    // Fall back to regular calculation if nighttime data unavailable
    const {
      calculateCloudScore,
      calculateLightPollutionScore,
      calculateSeeingScore,
      calculateWindScore,
      calculateHumidityScore,
      calculateMoonScore,
      calculateAQIScore,
      getWeights
    } = protectedFactors;
    
    // Extract weather data or use defaults
    const cloudCover = validateCloudCover(weatherData.cloudCover);
    const windSpeed = weatherData.windSpeed || 0;
    const humidity = weatherData.humidity || 50;
    const aqi = weatherData.aqi || 50;
    
    // Calculate individual factor scores
    const cloudScore = calculateCloudScore(cloudCover);
    const lightPollutionScore = calculateLightPollutionScore(bortleScale);
    const seeingScore = calculateSeeingScore(seeingConditions);
    const windScore = calculateWindScore(windSpeed);
    const humidityScore = calculateHumidityScore(humidity);
    const moonScore = calculateMoonScore(moonPhase);
    const aqiScore = calculateAQIScore(aqi);
    
    // Get factor weights
    const weights = getWeights();
    
    // Calculate weighted score
    const weightedScore = (
      cloudScore * weights.cloud +
      lightPollutionScore * weights.lightPollution +
      seeingScore * weights.seeing +
      windScore * weights.wind +
      humidityScore * weights.humidity +
      moonScore * weights.moon +
      aqiScore * weights.aqi
    ) / 10;
    
    // Normalize the final score to 0-10 range
    const finalScore = normalizeScore(weightedScore);
    
    // Determine viability based on minimum threshold
    const isViable = finalScore >= 2.0;
    
    // Return comprehensive results
    return {
      score: finalScore,
      isViable,
      factors: [
        { name: "Cloud Cover", score: cloudScore / 10, description: `Cloud cover of ${cloudCover}%` },
        { name: "Light Pollution", score: lightPollutionScore / 10, description: `Bortle Scale ${bortleScale}` },
        { name: "Seeing Conditions", score: seeingScore / 10, description: `Seeing conditions: ${seeingConditions}` },
        { name: "Wind Speed", score: windScore / 10, description: `Wind speed: ${windSpeed} km/h` },
        { name: "Humidity", score: humidityScore / 10, description: `Humidity: ${humidity}%` },
        { name: "Moon Phase", score: moonScore / 10, description: `Moon phase: ${(moonPhase * 100).toFixed(0)}%` },
        { name: "Air Quality", score: aqiScore / 10, description: `AQI: ${aqi}` }
      ]
    };
    
  } catch (error) {
    console.error("Error in SIQS calculation:", error);
    return { score: 0, isViable: false, factors: [] };
  }
}

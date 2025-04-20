
import { validateCloudCover } from '@/lib/siqs/utils';
import { calculateNighttimeSIQS, calculateTonightCloudCover } from '@/utils/nighttimeSIQS';
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
      
      // Use the formula: sum(cc percentage of each hour tonight: 18:00-7:00)/13
      // or current time to 7:00 if current time is within nighttime hours
      const tonightCloudCover = calculateTonightCloudCover(forecastData.hourly, 0, 0);
      console.log(`Tonight's cloud cover (18:00-7:00): ${tonightCloudCover.toFixed(1)}%`);
      
      // If we have valid tonight cloud cover data
      if (tonightCloudCover !== 0 || forecastData.hourly.cloud_cover) {
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
        
        // If calculation failed but we have tonight's cloud cover, create a simplified result
        if (tonightCloudCover >= 0) {
          // Base score mainly on cloud cover
          const cloudScore = Math.max(0, 100 - (tonightCloudCover * 2.5));
          const normalizedScore = normalizeScore(cloudScore / 10);
          
          return {
            score: normalizedScore,
            isViable: normalizedScore >= 2.0,
            factors: [
              {
                name: "Cloud Cover",
                score: cloudScore / 100,
                description: `Tonight's cloud cover: ${tonightCloudCover.toFixed(1)}%`,
                nighttimeData: {
                  average: tonightCloudCover,
                  timeRange: "18:00-7:00"
                }
              }
            ]
          };
        }
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

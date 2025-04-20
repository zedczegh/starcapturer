
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
 * Extract single hour cloud cover data for efficient SIQS calculation
 * @param forecastData Forecast data containing hourly predictions
 * @param targetHour Target hour to extract (e.g., 1 for 1:00 AM)
 * @returns The cloud cover percentage at the target hour or average if not found
 */
export function extractSingleHourCloudCover(forecastData: any, targetHour: number = 1): number {
  try {
    if (!forecastData?.hourly) return 50; // Default to medium cloud cover
    
    const hourlyData = forecastData.hourly;
    let cloudCover = 50;
    
    // Check if hourly data is an array of objects with time and cloud_cover
    if (Array.isArray(hourlyData.time) && Array.isArray(hourlyData.cloud_cover)) {
      // Find entries for the target hour
      const targetHourEntries: number[] = [];
      
      for (let i = 0; i < hourlyData.time.length; i++) {
        const time = hourlyData.time[i];
        if (!time) continue;
        
        // Parse the timestamp to get the hour
        const timestamp = new Date(time);
        if (isNaN(timestamp.getTime())) continue;
        
        // Check if this entry is for our target hour
        if (timestamp.getHours() === targetHour) {
          const cover = hourlyData.cloud_cover[i];
          if (typeof cover === 'number') {
            targetHourEntries.push(cover);
          }
        }
      }
      
      // If we found entries for the target hour, average them
      if (targetHourEntries.length > 0) {
        cloudCover = targetHourEntries.reduce((sum, val) => sum + val, 0) / targetHourEntries.length;
        console.log(`Found ${targetHourEntries.length} entries for ${targetHour}:00, avg cloud cover: ${cloudCover.toFixed(1)}%`);
      }
    } else if (Array.isArray(hourlyData)) {
      // Handle array of objects format
      const targetEntries = hourlyData.filter((entry: any) => {
        if (!entry?.time) return false;
        const date = new Date(entry.time);
        return !isNaN(date.getTime()) && date.getHours() === targetHour;
      });
      
      if (targetEntries.length > 0) {
        cloudCover = targetEntries.reduce((sum: number, entry: any) => 
          sum + (entry.cloud_cover || 50), 0) / targetEntries.length;
        console.log(`Found ${targetEntries.length} entries for ${targetHour}:00, avg cloud cover: ${cloudCover.toFixed(1)}%`);
      }
    }
    
    return cloudCover;
  } catch (error) {
    console.error("Error extracting single hour cloud cover:", error);
    return 50; // Default to medium cloud cover on error
  }
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
      
      // First try using the optimized single-hour approach for faster calculation
      const singleHourCloudCover = extractSingleHourCloudCover(forecastData, 1); // Use 1 AM
      
      // If we have valid single hour cloud cover, use it for SIQS calculation
      if (singleHourCloudCover !== null) {
        const cloudScore = Math.max(0, 100 - (singleHourCloudCover * 2.5));
        const normalizedScore = normalizeScore(cloudScore / 10);
        
        return {
          score: normalizedScore,
          isViable: normalizedScore >= 2.0,
          factors: [
            {
              name: "Cloud Cover",
              score: cloudScore / 100,
              description: `1 AM cloud cover: ${singleHourCloudCover.toFixed(1)}%`,
              nighttimeData: {
                average: singleHourCloudCover,
                timeRange: "1:00-2:00",
                sourceType: "optimized"
              }
            }
          ]
        };
      }
      
      // Fall back to using full night calculation if single-hour approach fails
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

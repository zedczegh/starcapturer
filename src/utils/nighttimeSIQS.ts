
/**
 * Enhanced utility for calculating SIQS based specifically on nighttime conditions
 */
import { calculateSIQS } from '@/lib/calculateSIQS';
import { isNighttimeCloudDataStale } from '@/utils/validation/weatherDataSync';
import { SIQSResult } from '@/lib/siqs/types';
import { calculateAverageCloudCover, extractNightForecasts, splitEveningMorningForecasts } from '@/components/forecast/NightForecastUtils';

/**
 * Filter forecast data to include only nighttime hours (6 PM to 7 AM)
 * @param forecast Array of forecast items
 * @returns Filtered array with only nighttime hours
 */
export const filterNighttimeForecast = (forecast: any[]): any[] => {
  if (!forecast || !Array.isArray(forecast) || forecast.length === 0) return [];
  
  return forecast.filter(item => {
    if (!item.time && !item.date) return false;
    const timeStr = item.time || item.date;
    const itemTime = new Date(timeStr);
    const hour = itemTime.getHours();
    // Nighttime is defined as 6 PM to 7 AM
    return hour >= 18 || hour < 7;
  });
};

/**
 * Calculate average value from an array of forecast items for a specific property
 * With optional weighting for specific hours
 * @param forecast Array of forecast items
 * @param property Property name to average
 * @param defaultValue Default value if property doesn't exist
 * @returns Average value
 */
export const calculateAverageValue = (
  forecast: any[], 
  property: string, 
  defaultValue: number = 0,
  useWeighting: boolean = false
): number => {
  if (!forecast || forecast.length === 0) return defaultValue;
  
  let sum = 0;
  let totalWeight = 0;
  
  for (let i = 0; i < forecast.length; i++) {
    const item = forecast[i];
    const value = item[property];
    
    if (typeof value === 'number') {
      // Apply weighting if requested
      if (useWeighting) {
        const timeStr = item.time || item.date;
        const hour = timeStr ? new Date(timeStr).getHours() : undefined;
        
        // Default weight
        let weight = 1.0;
        
        // Prime viewing hours get higher weight
        if (hour !== undefined) {
          if ((hour >= 22 && hour <= 23) || (hour >= 0 && hour <= 4)) {
            weight = 2.0; // Double weight for prime viewing hours
          } else if (hour >= 18 && hour <= 21) {
            weight = 0.8; // Slightly reduced weight for early evening
          }
        }
        
        sum += value * weight;
        totalWeight += weight;
      } else {
        // No weighting
        sum += value;
        totalWeight += 1;
      }
    }
  }
  
  return totalWeight > 0 ? (sum / totalWeight) : defaultValue;
};

/**
 * Checks if current conditions make imaging impossible
 * With more nuanced threshold based on opacity research
 * @param cloudCover Cloud cover percentage
 * @returns True if conditions make imaging impossible
 */
export const isImagingImpossible = (cloudCover: number): boolean => {
  // Adjust threshold based on research - 70% is more reasonable cutoff
  return typeof cloudCover === 'number' && cloudCover > 70;
};

/**
 * Calculate SIQS score focusing on nighttime conditions from forecast data
 * @param locationData Current location data
 * @param forecastData Hourly forecast data
 * @param translator Translation function
 * @returns SIQS analysis result
 */
export const calculateNighttimeSIQS = (
  locationData: any,
  forecastData: any,
  translator: any
): SIQSResult | null => {
  if (!forecastData || !forecastData.hourly || !locationData) {
    console.log("Missing required data for nighttime SIQS calculation");
    return null;
  }
  
  // Check if we already have calculated nighttime cloud data that's not stale
  const weatherData = locationData.weatherData || {};
  let avgCloudCover;
  let nightForecast;
  
  if (weatherData.nighttimeCloudData && !isNighttimeCloudDataStale(weatherData.nighttimeCloudData)) {
    // Use pre-calculated nighttime cloud data if it's fresh
    console.log("Using existing nighttime cloud data for SIQS calculation");
    avgCloudCover = weatherData.nighttimeCloudData.average;
    
    // We'll still extract the night forecast for other parameters
    nightForecast = extractNightForecasts(forecastData.hourly);
  } else {
    // Extract nighttime hours from the forecast
    nightForecast = extractNightForecasts(forecastData.hourly);
    
    if (nightForecast.length === 0) {
      console.log("No nighttime hours in forecast data");
      return null;
    }
    
    // Calculate weighted average values for key weather conditions
    avgCloudCover = calculateAverageCloudCover(nightForecast);
  }
  
  // Split nighttime into evening and morning segments for detailed analysis
  const { evening: eveningCloudCover, morning: morningCloudCover } = 
    splitEveningMorningForecasts(nightForecast);
  
  // Check if average cloud cover makes imaging impossible with adjusted threshold
  if (isImagingImpossible(avgCloudCover)) {
    console.log(`Average nighttime cloud cover is ${avgCloudCover}%, which exceeds threshold`);
    return {
      score: 0,
      isViable: false,
      level: 'Poor',
      factors: [
        {
          name: translator ? translator("Cloud Cover", "云量") : "Cloud Cover",
          score: 0,
          description: translator
            ? translator(
                `Night cloud cover of ${Math.round(avgCloudCover)}% makes imaging impossible`,
                `${Math.round(avgCloudCover)}%的夜间云量使成像不可能`
              )
            : `Night cloud cover of ${Math.round(avgCloudCover)}% makes imaging impossible`
        }
      ],
      nighttimeCloudData: {
        average: avgCloudCover,
        evening: eveningCloudCover,
        morning: morningCloudCover,
        lastUpdated: new Date().toISOString()
      }
    };
  }
  
  // Additional weather parameters from night forecast with weighted averages
  const avgWindSpeed = calculateAverageValue(nightForecast, 'windSpeed', 10, true);
  const avgHumidity = calculateAverageValue(nightForecast, 'humidity', 50, true);
  const avgPrecipitation = calculateAverageValue(nightForecast, 'precipitation', 0, true);
  
  // Calculate SIQS using the average nighttime conditions
  const siqsInputs = {
    cloudCover: avgCloudCover,
    bortleScale: locationData.bortleScale || 5,
    seeingConditions: locationData.seeingConditions || 3,
    windSpeed: avgWindSpeed,
    humidity: avgHumidity,
    moonPhase: locationData.moonPhase || 0,
    precipitation: avgPrecipitation,
    aqi: weatherData?.aqi,
    // Add nighttime forecast data for more detailed analysis
    nightForecast: nightForecast
  };
  
  const calculatedResult = calculateSIQS(siqsInputs);
  
  // Create a properly typed SIQSResult object
  const siqsResult: SIQSResult = {
    score: calculatedResult.score,
    isViable: calculatedResult.isViable,
    level: calculatedResult.level,
    factors: calculatedResult.factors.map(factor => ({
      name: factor.name,
      score: factor.score,
      description: factor.description || 'No description provided' // Ensure description is always defined
    })),
    // Always include nighttime cloud data
    nighttimeCloudData: {
      average: avgCloudCover,
      evening: eveningCloudCover,
      morning: morningCloudCover,
      lastUpdated: new Date().toISOString()
    }
  };
  
  console.log(`Calculated nighttime SIQS: ${siqsResult.score}`);
  
  return siqsResult;
};

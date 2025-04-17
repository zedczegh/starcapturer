
/**
 * Utility for calculating SIQS based specifically on nighttime conditions
 */
import { calculateSIQS } from '@/lib/calculateSIQS';
import { calculateAstronomicalNight } from '@/utils/astronomy/nightTimeCalculator';

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
 * @param forecast Array of forecast items
 * @param property Property name to average
 * @param defaultValue Default value if property doesn't exist
 * @returns Average value
 */
export const calculateAverageValue = (
  forecast: any[], 
  property: string, 
  defaultValue: number = 0
): number => {
  if (!forecast || forecast.length === 0) return defaultValue;
  
  const sum = forecast.reduce((acc, item) => {
    const value = item[property];
    return acc + (typeof value === 'number' ? value : defaultValue);
  }, 0);
  
  return sum / forecast.length;
};

/**
 * Checks if current conditions make imaging impossible
 * @param cloudCover Cloud cover percentage
 * @returns True if conditions make imaging impossible
 */
export const isImagingImpossible = (cloudCover: number): boolean => {
  return typeof cloudCover === 'number' && cloudCover > 40;
};

/**
 * Calculate tonight's cloud cover based on astronomical night for a location
 * @param hourlyData Hourly forecast data
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Average cloud cover percentage during astronomical night
 */
export const calculateTonightCloudCover = (
  hourlyData: any[],
  latitude: number,
  longitude: number
): number => {
  if (!hourlyData || !Array.isArray(hourlyData) || hourlyData.length === 0) {
    return 0;
  }
  
  try {
    // Get astronomical night times
    const { start: nightStart, end: nightEnd } = calculateAstronomicalNight(latitude, longitude);
    
    // Filter hourly data to only include astronomical night hours
    const nightHours = hourlyData.filter(item => {
      if (!item.time) return false;
      const itemTime = new Date(item.time);
      return itemTime >= nightStart && itemTime <= nightEnd;
    });
    
    // If no night hours in the forecast, fall back to generic nighttime hours
    if (nightHours.length === 0) {
      return calculateAverageValue(filterNighttimeForecast(hourlyData), 'cloud_cover', 30);
    }
    
    // Calculate average cloud cover during astronomical night
    return calculateAverageValue(nightHours, 'cloud_cover', 30);
  } catch (error) {
    console.error("Error calculating tonight's cloud cover:", error);
    return 30; // Fallback to moderate cloud cover
  }
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
) => {
  if (!forecastData || !forecastData.hourly || !locationData) {
    console.log("Missing required data for nighttime SIQS calculation");
    return null;
  }
  
  try {
    // Extract coordinates
    const latitude = locationData.latitude || 0;
    const longitude = locationData.longitude || 0;
    
    // Calculate cloud cover for astronomical night specifically
    const tonightCloudCover = calculateTonightCloudCover(forecastData.hourly, latitude, longitude);
    
    // Extract nighttime hours from the forecast as backup
    const nightForecast = filterNighttimeForecast(forecastData.hourly);
    
    if (nightForecast.length === 0 && !tonightCloudCover) {
      console.log("No nighttime hours in forecast data");
      return null;
    }
    
    // Check if average cloud cover makes imaging impossible
    if (isImagingImpossible(tonightCloudCover)) {
      console.log(`Tonight's cloud cover is ${tonightCloudCover}%, which exceeds 40% threshold`);
      return {
        score: 0,
        isViable: false,
        factors: [
          {
            name: translator ? translator("Cloud Cover", "云量") : "Cloud Cover",
            score: 0,
            description: translator
              ? translator(`Cloud cover of ${Math.round(tonightCloudCover)}% makes imaging impossible`, `${Math.round(tonightCloudCover)}%的云量使成像不可能`)
              : `Cloud cover of ${Math.round(tonightCloudCover)}% makes imaging impossible`
          }
        ]
      };
    }
    
    // Calculate average values for key weather conditions using nighttime hours
    const avgWindSpeed = calculateAverageValue(nightForecast, 'windSpeed');
    const avgHumidity = calculateAverageValue(nightForecast, 'humidity');
    
    // Calculate SIQS using the average nighttime conditions
    const siqsResult = calculateSIQS({
      cloudCover: tonightCloudCover,
      bortleScale: locationData.bortleScale || 5,
      seeingConditions: locationData.seeingConditions || 3,
      windSpeed: avgWindSpeed,
      humidity: avgHumidity,
      moonPhase: locationData.moonPhase || 0,
      precipitation: calculateAverageValue(nightForecast, 'precipitation'),
      aqi: locationData.weatherData?.aqi,
      // Add nighttime forecast data for more detailed analysis
      nightForecast: nightForecast
    });
    
    console.log(`Calculated nighttime SIQS: ${siqsResult.score} (using astronomical night cloud cover: ${tonightCloudCover}%)`);
    
    return siqsResult;
  } catch (error) {
    console.error("Error calculating nighttime SIQS:", error);
    return null;
  }
};


/**
 * Utility for calculating SIQS based specifically on nighttime conditions
 */
import { calculateSIQS } from '@/lib/calculateSIQS';
import { getNightHours } from './astronomy/nightTimeCalculator';

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
  
  const validItems = forecast.filter(item => 
    item && typeof item[property] === 'number' && !isNaN(item[property])
  );
  
  if (validItems.length === 0) return defaultValue;
  
  const sum = validItems.reduce((acc, item) => acc + item[property], 0);
  return sum / validItems.length;
};

/**
 * Calculate tonight's cloud cover using astronomical night hours
 * @param forecast Hourly forecast data
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Average cloud cover during nighttime or null if not available
 */
export const calculateTonightCloudCover = (
  forecast: any[],
  latitude: number,
  longitude: number
): number | null => {
  if (!forecast || !Array.isArray(forecast) || forecast.length === 0) {
    console.log("No forecast data available for night cloud calculation");
    return null;
  }
  
  // Check if forecast is in Open-Meteo format with time and cloud_cover arrays
  const isOpenMeteoFormat = !forecast[0]?.time && 
    Array.isArray(forecast.time) && 
    Array.isArray(forecast.cloud_cover);
  
  // Convert forecast to standard format if it's in API format
  const standardizedForecast = isOpenMeteoFormat ? 
    // Handle Open-Meteo API format
    forecast.time.map((timeValue: string, index: number) => ({
      time: timeValue,
      cloudCover: forecast.cloud_cover[index]
    }))
    // Handle standard format
    : forecast.map(item => {
        if (item.time) return item;
        // For any other format, try to extract cloud cover
        return {
          time: item.date || new Date().toISOString(),
          cloudCover: item.cloudCover || item.cloud_cover
        };
      });
  
  // Get night hours for the location
  const today = new Date();
  const nightHours = getNightHours(latitude, longitude, today);
  
  // If no night hours are found, fallback to standard 6pm-7am definition
  if (!nightHours || nightHours.length === 0) {
    console.log("No astronomical night hours found, using fallback definition");
    const filteredForecast = filterNighttimeForecast(standardizedForecast);
    
    // If we still have no data, return null instead of default
    if (filteredForecast.length === 0) {
      console.log("No nighttime forecast data available");
      return null;
    }
    
    const cloudCoverValues = filteredForecast
      .map(item => item.cloudCover)
      .filter(value => typeof value === 'number' && !isNaN(value));
    
    if (cloudCoverValues.length === 0) return null;
    
    return cloudCoverValues.reduce((sum, val) => sum + val, 0) / cloudCoverValues.length;
  }
  
  // Filter forecast for tonight's night hours
  const tonightForecast = standardizedForecast.filter(item => {
    if (!item || (!item.time && !item.date)) return false;
    const timeStr = item.time || item.date;
    const itemTime = new Date(timeStr);
    return nightHours.includes(itemTime.getHours());
  });
  
  if (tonightForecast.length === 0) {
    console.log("No forecast data points found within astronomical night hours");
    // Try fallback but don't default to 0
    const fallbackForecast = filterNighttimeForecast(standardizedForecast);
    if (fallbackForecast.length === 0) return null;
    
    const validCloudValues = fallbackForecast
      .map(item => item.cloudCover)
      .filter(value => typeof value === 'number' && !isNaN(value));
    
    if (validCloudValues.length === 0) return null;
    return validCloudValues.reduce((sum, val) => sum + val, 0) / validCloudValues.length;
  }
  
  console.log(`Found ${tonightForecast.length} forecast data points for astronomical night`);
  const cloudValues = tonightForecast
    .map(item => item.cloudCover)
    .filter(value => typeof value === 'number' && !isNaN(value));
  
  if (cloudValues.length === 0) return null;
  return cloudValues.reduce((sum, val) => sum + val, 0) / cloudValues.length;
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
  
  // Extract nighttime hours from the forecast
  const nightForecast = filterNighttimeForecast(forecastData.hourly);
  
  if (nightForecast.length === 0) {
    console.log("No nighttime hours in forecast data");
    return null;
  }
  
  // Calculate average values for key weather conditions
  const avgCloudCover = calculateAverageValue(nightForecast, 'cloudCover');
  const avgWindSpeed = calculateAverageValue(nightForecast, 'windSpeed');
  const avgHumidity = calculateAverageValue(nightForecast, 'humidity');
  
  // Check if average cloud cover makes imaging impossible
  if (isImagingImpossible(avgCloudCover)) {
    console.log(`Average nighttime cloud cover is ${avgCloudCover}%, which exceeds 40% threshold`);
    return {
      score: 0,
      isViable: false,
      factors: [
        {
          name: translator ? translator("Cloud Cover", "云量") : "Cloud Cover",
          score: 0,
          description: translator ? translator(
            `Cloud cover of ${Math.round(avgCloudCover)}% makes imaging impossible`,
            `${Math.round(avgCloudCover)}%的云量使成像不可能`
          ) : `Cloud cover of ${Math.round(avgCloudCover)}% makes imaging impossible`
        }
      ]
    };
  }
  
  // Calculate SIQS using the average nighttime conditions
  const siqsResult = calculateSIQS({
    cloudCover: avgCloudCover,
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
  
  console.log(`Calculated nighttime SIQS: ${siqsResult.score}`);
  console.log(`Using nighttime forecast for SIQS calculation: ${siqsResult.score}`);
  
  return siqsResult;
};

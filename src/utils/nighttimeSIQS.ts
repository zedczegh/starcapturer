
/**
 * Utility for calculating SIQS based specifically on nighttime conditions
 */
import { calculateSIQS } from '@/lib/calculateSIQS';

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
 * Calculate average cloud cover for tonight from forecast data
 * @param forecastHourly Hourly forecast data
 * @returns Average cloud cover percentage
 */
export const calculateTonightCloudCover = (
  forecastHourly: any,
  latitude?: number,
  longitude?: number
): number => {
  try {
    if (!forecastHourly) return 0;
    
    // Handle different forecast data structures
    let hourlyData = [];
    
    if (Array.isArray(forecastHourly)) {
      // Direct array format
      hourlyData = forecastHourly;
    } else if (forecastHourly.time && Array.isArray(forecastHourly.time)) {
      // Open-meteo format with separate arrays
      const times = forecastHourly.time;
      const cloudCover = forecastHourly.cloud_cover || forecastHourly.cloudcover || [];
      
      hourlyData = times.map((time: string, index: number) => ({
        time,
        cloudCover: cloudCover[index]
      }));
    }
    
    // Filter for nighttime hours
    const nightHours = hourlyData.filter(item => {
      if (!item.time) return false;
      const date = new Date(item.time);
      const hour = date.getHours();
      return hour >= 18 || hour < 7;
    });
    
    if (nightHours.length === 0) return 0;
    
    // Calculate average cloud cover
    const cloudProperty = 'cloudCover' in nightHours[0] ? 'cloudCover' : 
                         'cloud_cover' in nightHours[0] ? 'cloud_cover' : 
                         'cloudcover';
    
    const totalCloudCover = nightHours.reduce((sum, hour) => {
      const value = hour[cloudProperty];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    
    return totalCloudCover / nightHours.length;
  } catch (error) {
    console.error('Error calculating tonight cloud cover:', error);
    return 0;
  }
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
  const nightForecast = Array.isArray(forecastData.hourly) ? 
    filterNighttimeForecast(forecastData.hourly) : 
    filterNighttimeForecast(forecastData.hourly.time?.map((time: string, idx: number) => ({
      time,
      cloudCover: forecastData.hourly.cloud_cover?.[idx] || 0,
      windSpeed: forecastData.hourly.wind_speed_10m?.[idx] || 0,
      humidity: forecastData.hourly.relative_humidity_2m?.[idx] || 50,
      precipitation: forecastData.hourly.precipitation?.[idx] || 0
    })) || []);
  
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
          description: translator ? 
            translator(
              `Cloud cover of ${Math.round(avgCloudCover)}% makes imaging impossible`,
              `${Math.round(avgCloudCover)}%的云量使成像不可能`
            ) :
            `Cloud cover of ${Math.round(avgCloudCover)}% makes imaging impossible`
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
  
  return siqsResult;
};

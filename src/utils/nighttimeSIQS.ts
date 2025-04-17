
import { calculateSIQS } from "@/lib/calculateSIQS";

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
 * Calculate tonight's cloud cover based on forecast data
 * Uses the formula: sum(cloud cover percentage for each hour from 18:00-7:00) / number of hours
 * For current time between 18:00-7:00: sum(cloud cover from current hour to 7:00) / remaining hours
 */
export const calculateTonightCloudCover = (hourlyData: any): number => {
  if (!hourlyData || !hourlyData.time || !hourlyData.cloud_cover) {
    return 0;
  }
  
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const today = currentTime.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const tomorrow = new Date(currentTime);
  tomorrow.setDate(currentTime.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  let totalCloudCover = 0;
  let hoursCount = 0;
  
  // Process each hour in the forecast
  for (let i = 0; i < hourlyData.time.length; i++) {
    const timeStr = hourlyData.time[i];
    const forecastDate = new Date(timeStr);
    const forecastHour = forecastDate.getHours();
    const dateStr = timeStr.split('T')[0];
    
    // Current time is before 6 PM - use full night (18:00-7:00)
    if (currentHour < 18) {
      if ((dateStr === today && forecastHour >= 18) || 
          (dateStr === tomorrowStr && forecastHour < 7)) {
        if (typeof hourlyData.cloud_cover[i] === 'number') {
          totalCloudCover += hourlyData.cloud_cover[i];
          hoursCount++;
        }
      }
    }
    // Current time is after 6 PM - use hours from current time to 7 AM
    else if (currentHour >= 18) {
      if ((dateStr === today && forecastHour >= currentHour) || 
          (dateStr === tomorrowStr && forecastHour < 7)) {
        if (typeof hourlyData.cloud_cover[i] === 'number') {
          totalCloudCover += hourlyData.cloud_cover[i];
          hoursCount++;
        }
      }
    }
    // Current time is after midnight but before 7 AM - use remaining hours until 7 AM
    else if (currentHour < 7) {
      if (dateStr === today && forecastHour >= currentHour && forecastHour < 7) {
        if (typeof hourlyData.cloud_cover[i] === 'number') {
          totalCloudCover += hourlyData.cloud_cover[i];
          hoursCount++;
        }
      }
    }
  }
  
  // Calculate average - if no valid hours found, return 0
  return hoursCount > 0 ? totalCloudCover / hoursCount : 0;
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
    // Calculate tonight's cloud cover using the strict formula
    const tonightCloudCover = calculateTonightCloudCover(forecastData.hourly);
    
    // If no valid cloud cover data is available, we can't calculate
    if (tonightCloudCover === 0 && !forecastData.hourly.cloud_cover) {
      console.log("No valid cloud cover data found for tonight");
      return null;
    }
    
    console.log(`Calculated tonight's cloud cover (18:00-7:00): ${tonightCloudCover.toFixed(1)}%`);
    
    // Check if average cloud cover makes imaging impossible
    if (isImagingImpossible(tonightCloudCover)) {
      console.log(`Tonight's cloud cover is ${tonightCloudCover.toFixed(1)}%, which exceeds 40% threshold`);
      return {
        score: 0,
        isViable: false,
        factors: [
          {
            name: translator ? translator("Cloud Cover", "云量") : "Cloud Cover",
            score: 0,
            description: translator
              ? translator(
                  `Cloud cover of ${Math.round(tonightCloudCover)}% makes imaging impossible`,
                  `${Math.round(tonightCloudCover)}%的云量使成像不可能`
                )
              : `Cloud cover of ${Math.round(tonightCloudCover)}% makes imaging impossible`,
            nighttimeData: {
              average: tonightCloudCover,
              timeRange: "18:00-7:00"
            }
          }
        ]
      };
    }
    
    // Extract nighttime forecast for other weather parameters
    const nightForecast = filterNighttimeForecast(forecastData.hourly.time.map((time: string, i: number) => ({
      time,
      cloudCover: forecastData.hourly.cloud_cover?.[i] || 0,
      windSpeed: forecastData.hourly.wind_speed_10m?.[i] || 0,
      humidity: forecastData.hourly.relative_humidity_2m?.[i] || 0,
      precipitation: forecastData.hourly.precipitation?.[i] || 0
    })));
    
    // Calculate average values for other conditions
    const avgWindSpeed = calculateAverageValue(nightForecast, 'windSpeed');
    const avgHumidity = calculateAverageValue(nightForecast, 'humidity');
    
    // Calculate SIQS using tonight's cloud cover and other nighttime conditions
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
    
    // Add detailed nighttime cloud data to the cloud cover factor
    if (siqsResult && siqsResult.factors) {
      siqsResult.factors = siqsResult.factors.map((factor: any) => {
        if (factor.name === "Cloud Cover" || 
            (translator && factor.name === translator("Cloud Cover", "云层覆盖"))) {
          return {
            ...factor,
            nighttimeData: {
              average: tonightCloudCover,
              timeRange: "18:00-7:00",
            }
          };
        }
        return factor;
      });
    }
    
    console.log(`Calculated nighttime SIQS: ${siqsResult.score.toFixed(1)}`);
    return siqsResult;
  } catch (error) {
    console.error("Error in nighttime SIQS calculation:", error);
    return null;
  }
};

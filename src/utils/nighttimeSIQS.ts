import { calculateSIQS } from "@/lib/calculateSIQS";
import { calculateAstronomicalNight, formatTime } from "@/utils/astronomy/nightTimeCalculator";

/**
 * Filter forecast data to include only astronomical nighttime hours
 * @param forecast Array of forecast items
 * @param latitude Latitude for astronomical night calculation
 * @param longitude Longitude for astronomical night calculation
 * @returns Filtered array with only nighttime hours
 */
export const filterNighttimeForecast = (
  forecast: any[],
  latitude: number = 0,
  longitude: number = 0
): any[] => {
  if (!forecast || !Array.isArray(forecast) || forecast.length === 0) return [];
  
  // Get astronomical night times for the location
  const { start: nightStart, end: nightEnd } = calculateAstronomicalNight(latitude, longitude);
  
  return forecast.filter(item => {
    if (!item.time && !item.date) return false;
    const timeStr = item.time || item.date;
    const itemTime = new Date(timeStr);
    
    // Check if the forecast time falls within astronomical night
    return itemTime >= nightStart && itemTime <= nightEnd;
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
  
  const values = forecast
    .map(item => item[property])
    .filter(value => typeof value === 'number');
  
  if (values.length === 0) return defaultValue;
  
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
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
 * Calculate tonight's cloud cover based on astronomical night hours
 * Uses each hour's cloud cover from the forecast during astronomical night
 * @param hourlyData Hourly forecast data
 * @param latitude Latitude for astronomical night calculation
 * @param longitude Longitude for astronomical night calculation
 * @returns Average cloud cover during astronomical night
 */
export const calculateTonightCloudCover = (
  hourlyData: any,
  latitude?: number,
  longitude?: number
): number => {
  if (!hourlyData || !hourlyData.time || !hourlyData.cloud_cover) {
    console.log("Missing required hourly data for cloud cover calculation");
    return 0;
  }
  
  // Get current time and date info
  const currentTime = new Date();
  
  // Determine if we have valid coordinates
  const hasCoordinates = typeof latitude === 'number' && typeof longitude === 'number';
  
  // Get astronomical night times for the location
  let nightStart: Date, nightEnd: Date;
  let nightHours: number[] = [];
  let nightTimeStr = "18:00-7:00"; // Default fallback
  
  if (hasCoordinates && latitude !== 0 && longitude !== 0) {
    // Calculate astronomical night times for the specific location
    try {
      const nightTimes = calculateAstronomicalNight(latitude, longitude);
      nightStart = nightTimes.start;
      nightEnd = nightTimes.end;
      
      // Create a formatted time range string for display
      nightTimeStr = `${formatTime(nightStart)}-${formatTime(nightEnd)}`;
      
      // Generate night hours array
      let hour = nightStart.getHours();
      while (hour !== nightEnd.getHours()) {
        nightHours.push(hour);
        hour = (hour + 1) % 24;
      }
      nightHours.push(nightEnd.getHours()); // Include the end hour
    } catch (error) {
      console.log("Error calculating astronomical night:", error);
      // Fallback to default night definition
      const defaultNight = new Date();
      defaultNight.setHours(18, 0, 0, 0);
      nightStart = new Date(defaultNight);
      
      const nextDay = new Date(defaultNight);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(7, 0, 0, 0);
      nightEnd = new Date(nextDay);
      
      nightHours = Array.from({ length: 13 }, (_, i) => (i + 18) % 24);
    }
  } else {
    // Fall back to default night definition (18:00-7:00)
    nightHours = Array.from({ length: 13 }, (_, i) => (i + 18) % 24);
    const defaultNight = new Date();
    defaultNight.setHours(18, 0, 0, 0);
    nightStart = new Date(defaultNight);
    
    const nextDay = new Date(defaultNight);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(7, 0, 0, 0);
    nightEnd = new Date(nextDay);
  }
  
  const cloudCoverValues: number[] = [];
  let timeRangeStart: Date | null = null;
  let timeRangeEnd: Date | null = null;
  
  // Determine which hours to consider based on current time
  let relevantHours: Date[] = [];
  
  // Process each hour in the forecast
  for (let i = 0; i < hourlyData.time.length; i++) {
    const timeStr = hourlyData.time[i];
    const forecastDate = new Date(timeStr);
    
    // Skip if we don't have cloud cover data for this hour
    if (typeof hourlyData.cloud_cover[i] !== 'number') {
      continue;
    }
    
    // Check if this hour is during night
    const forecastHour = forecastDate.getHours();
    const isDuringNight = nightHours.includes(forecastHour);
    
    if (isDuringNight) {
      // Only consider future forecasts
      if (forecastDate >= currentTime) {
        relevantHours.push(forecastDate);
        cloudCoverValues.push(hourlyData.cloud_cover[i]);
        
        // Track the time range for the forecast
        if (!timeRangeStart || forecastDate < timeRangeStart) {
          timeRangeStart = new Date(forecastDate);
        }
        if (!timeRangeEnd || forecastDate > timeRangeEnd) {
          timeRangeEnd = new Date(forecastDate);
        }
      }
    }
  }
  
  // If we don't have any relevant hours, check if we need to look at tomorrow night
  if (cloudCoverValues.length === 0) {
    const now = new Date();
    const currentHour = now.getHours();
    
    // If we're past nightStart today, look at tomorrow's forecast
    if (currentHour > nightStart.getHours()) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      for (let i = 0; i < hourlyData.time.length; i++) {
        const timeStr = hourlyData.time[i];
        const forecastDate = new Date(timeStr);
        
        // Skip if date is not tomorrow
        if (forecastDate.getDate() !== tomorrow.getDate()) continue;
        
        // Skip if we don't have cloud cover data
        if (typeof hourlyData.cloud_cover[i] !== 'number') continue;
        
        const forecastHour = forecastDate.getHours();
        const isDuringNight = nightHours.includes(forecastHour);
        
        if (isDuringNight) {
          relevantHours.push(forecastDate);
          cloudCoverValues.push(hourlyData.cloud_cover[i]);
          
          // Track time range
          if (!timeRangeStart || forecastDate < timeRangeStart) {
            timeRangeStart = new Date(forecastDate);
          }
          if (!timeRangeEnd || forecastDate > timeRangeEnd) {
            timeRangeEnd = new Date(forecastDate);
          }
        }
      }
    }
  }
  
  // Calculate average cloud cover
  const averageCloudCover = cloudCoverValues.length > 0 
    ? cloudCoverValues.reduce((sum, val) => sum + val, 0) / cloudCoverValues.length 
    : 0;
  
  // Format the time range for logging
  const timeRange = timeRangeStart && timeRangeEnd 
    ? `${formatTime(timeRangeStart)}-${formatTime(timeRangeEnd)}`
    : nightTimeStr;
  
  console.log(`Calculated cloud cover for tonight (${timeRange}): ${averageCloudCover.toFixed(1)}% (from ${cloudCoverValues.length} data points)`);
  
  return averageCloudCover;
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
    // Extract coordinates for astronomical night calculations
    const latitude = locationData.latitude || 0;
    const longitude = locationData.longitude || 0;
    
    // Get astronomical night times
    const { start: nightStart, end: nightEnd } = calculateAstronomicalNight(latitude, longitude);
    const nightTimeStr = `${formatTime(nightStart)}-${formatTime(nightEnd)}`;
    
    // Calculate tonight's cloud cover using astronomical night
    const tonightCloudCover = calculateTonightCloudCover(forecastData.hourly, latitude, longitude);
    
    // If no valid cloud cover data is available, we can't calculate
    if (tonightCloudCover === 0 && !forecastData.hourly.cloud_cover) {
      console.log("No valid cloud cover data found for tonight");
      return null;
    }
    
    console.log(`Calculated tonight's cloud cover (${nightTimeStr}): ${tonightCloudCover.toFixed(1)}%`);
    
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
              timeRange: nightTimeStr
            }
          }
        ]
      };
    }
    
    // Extract nighttime forecast for other weather parameters using astronomical night hours
    const nightForecast = forecastData.hourly.time.map((time: string, i: number) => {
      const forecastTime = new Date(time);
      return {
        time,
        isNight: forecastTime >= nightStart && forecastTime <= nightEnd,
        cloudCover: forecastData.hourly.cloud_cover?.[i] || 0,
        windSpeed: forecastData.hourly.wind_speed_10m?.[i] || 0,
        humidity: forecastData.hourly.relative_humidity_2m?.[i] || 0,
        precipitation: forecastData.hourly.precipitation?.[i] || 0
      };
    }).filter((item: any) => item.isNight);
    
    // Calculate average values for other conditions during astronomical night
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
              timeRange: nightTimeStr,
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

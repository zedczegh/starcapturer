
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
  } else {
    // Fall back to default night definition (18:00-7:00)
    nightHours = Array.from({ length: 13 }, (_, i) => (i + 18) % 24);
    const defaultNight = new Date();
    defaultNight.setHours(18, 0, 0, 0);
    nightStart = new Date(defaultNight);
    
    defaultNight.setDate(defaultNight.getDate() + 1);
    defaultNight.setHours(7, 0, 0, 0);
    nightEnd = new Date(defaultNight);
  }
  
  // Current hour
  const currentHour = currentTime.getHours();
  
  let totalCloudCover = 0;
  let hoursCount = 0;
  const cloudCoverValues: number[] = [];
  
  // Current date in YYYY-MM-DD format
  const today = currentTime.toISOString().split('T')[0];
  const tomorrow = new Date(currentTime);
  tomorrow.setDate(currentTime.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  // Process each hour in the forecast
  for (let i = 0; i < hourlyData.time.length; i++) {
    const timeStr = hourlyData.time[i];
    const forecastDate = new Date(timeStr);
    const forecastHour = forecastDate.getHours();
    const dateStr = timeStr.split('T')[0];
    
    // Logic depends on current time relative to night period
    
    // CASE 1: Current time is before astronomical night
    if (currentTime < nightStart) {
      // Include all hours of tonight's astronomical night
      if ((dateStr === today && forecastDate >= nightStart) || 
          (dateStr === tomorrowStr && forecastDate <= nightEnd)) {
        if (typeof hourlyData.cloud_cover[i] === 'number') {
          const cloudCoverValue = hourlyData.cloud_cover[i];
          totalCloudCover += cloudCoverValue;
          cloudCoverValues.push(cloudCoverValue);
          hoursCount++;
        }
      }
    }
    // CASE 2: Current time is during astronomical night
    else if (currentTime >= nightStart && currentTime <= nightEnd) {
      // Only include hours from current time until the end of night
      if ((dateStr === today || dateStr === tomorrowStr) && 
          forecastDate >= currentTime && forecastDate <= nightEnd) {
        if (typeof hourlyData.cloud_cover[i] === 'number') {
          const cloudCoverValue = hourlyData.cloud_cover[i];
          totalCloudCover += cloudCoverValue;
          cloudCoverValues.push(cloudCoverValue);
          hoursCount++;
        }
      }
    }
    // CASE 3: Current time is after astronomical night
    else {
      // Use tomorrow night's forecast
      const tomorrowNight = new Date(nightStart);
      tomorrowNight.setDate(tomorrowNight.getDate() + 1);
      
      const tomorrowNightEnd = new Date(nightEnd);
      tomorrowNightEnd.setDate(tomorrowNightEnd.getDate() + 1);
      
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];
      
      if ((dateStr === tomorrowStr && forecastDate >= tomorrowNight) || 
          (dateStr === dayAfterTomorrowStr && forecastDate <= tomorrowNightEnd)) {
        if (typeof hourlyData.cloud_cover[i] === 'number') {
          const cloudCoverValue = hourlyData.cloud_cover[i];
          totalCloudCover += cloudCoverValue;
          cloudCoverValues.push(cloudCoverValue);
          hoursCount++;
        }
      }
    }
  }
  
  // Cache the astronomical night data for this location
  if (hasCoordinates) {
    try {
      sessionStorage.setItem(`astro_night_${latitude?.toFixed(2)}_${longitude?.toFixed(2)}`, JSON.stringify({
        start: nightStart.toISOString(),
        end: nightEnd.toISOString(),
        formatted: nightTimeStr,
        cloudCover: hoursCount > 0 ? totalCloudCover / hoursCount : null,
        timestamp: new Date().toISOString()
      }));
    } catch (err) {
      console.error("Failed to cache astronomical night data:", err);
    }
  }
  
  // Calculate average - if no valid hours found, return 0
  return hoursCount > 0 ? totalCloudCover / hoursCount : 0;
};

/**
 * Get cached astronomical night data for a location if available
 * @param latitude Location latitude 
 * @param longitude Location longitude
 * @returns Cached astronomical night data or null
 */
export const getCachedAstronomicalNight = (
  latitude: number,
  longitude: number
): { start: Date; end: Date; formatted: string; cloudCover: number | null } | null => {
  try {
    const cacheKey = `astro_night_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    
    if (cachedData) {
      const data = JSON.parse(cachedData);
      const cacheTimestamp = new Date(data.timestamp);
      const now = new Date();
      
      // Cache valid for 6 hours
      if ((now.getTime() - cacheTimestamp.getTime()) < 6 * 60 * 60 * 1000) {
        return {
          start: new Date(data.start),
          end: new Date(data.end),
          formatted: data.formatted,
          cloudCover: data.cloudCover
        };
      }
    }
    return null;
  } catch (err) {
    console.error("Error retrieving cached astronomical night data:", err);
    return null;
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
    // Extract coordinates for astronomical night calculations
    const latitude = locationData.latitude || 0;
    const longitude = locationData.longitude || 0;
    
    // First check for cached astronomical night data
    let nightTimeStr = "18:00-7:00";
    let cachedNight = null;
    
    if (latitude && longitude) {
      cachedNight = getCachedAstronomicalNight(latitude, longitude);
      if (cachedNight) {
        nightTimeStr = cachedNight.formatted;
        console.log(`Using cached astronomical night data: ${nightTimeStr}`);
      }
    }
    
    // Get astronomical night times if not cached
    if (!cachedNight) {
      const { start: nightStart, end: nightEnd } = calculateAstronomicalNight(latitude, longitude);
      nightTimeStr = `${formatTime(nightStart)}-${formatTime(nightEnd)}`;
      console.log(`Calculated astronomical night: ${nightTimeStr}`);
    }
    
    // Calculate tonight's cloud cover using astronomical night
    // Use cached value if available
    let tonightCloudCover = cachedNight?.cloudCover || 0;
    
    // Calculate if not cached or null
    if (!tonightCloudCover) {
      tonightCloudCover = calculateTonightCloudCover(forecastData.hourly, latitude, longitude);
    }
    
    // If no valid cloud cover data is available, we can't calculate
    if (tonightCloudCover === 0 && !forecastData.hourly.cloud_cover) {
      console.log("No valid cloud cover data found for tonight");
      return null;
    }
    
    console.log(`Tonight's cloud cover (${nightTimeStr}): ${tonightCloudCover.toFixed(1)}%`);
    
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
      // We don't need to recalculate night times if we already have cached data
      let isNight = false;
      if (cachedNight) {
        const forecastTime = new Date(time);
        isNight = forecastTime >= cachedNight.start && forecastTime <= cachedNight.end;
      } else {
        // Calculate on the fly if not cached
        const { start: nightStart, end: nightEnd } = calculateAstronomicalNight(latitude, longitude);
        const forecastTime = new Date(time);
        isNight = forecastTime >= nightStart && forecastTime <= nightEnd;
      }
      
      return {
        time,
        isNight,
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
    
    // Store astronomical night metadata for this location
    if (locationData.metadata) {
      locationData.metadata.astronomicalNight = {
        start: cachedNight ? cachedNight.start.toISOString() : new Date().toISOString(),
        end: cachedNight ? cachedNight.end.toISOString() : new Date().toISOString(),
        formattedTime: nightTimeStr
      };
    }
    
    return siqsResult;
  } catch (error) {
    console.error("Error in nighttime SIQS calculation:", error);
    return null;
  }
};

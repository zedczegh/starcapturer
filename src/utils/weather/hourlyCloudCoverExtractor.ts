
// Import the correct type definition instead of ForecastData
interface ForecastData {
  hourly?: {
    time?: string[];
    cloudcover?: number[];
  };
}

/**
 * Extract cloud cover percentage for a specific hour of the day
 * Optimized for astronomy viewing at night
 * 
 * @param forecastData The full forecast data object
 * @param targetHour The hour to extract (0-23)
 * @returns Cloud cover percentage or null if not available
 */
export function extractSingleHourCloudCover(
  forecastData: ForecastData | null,
  targetHour: number = 1
): number | null {
  if (!forecastData?.hourly?.time || !forecastData.hourly.cloudcover) {
    return null;
  }

  // Get current date/time and calculate the next occurrence of target hour
  const now = new Date();
  const tonight = new Date(
    now.getFullYear(),
    now.getMonth(),
    // If current time is already past target hour, use tomorrow
    now.getHours() >= targetHour ? now.getDate() + 1 : now.getDate(),
    targetHour
  );
  
  // Format as ISO string to match forecast data format
  const tonightIsoWithoutSeconds = tonight.toISOString().slice(0, 13) + ":00";
  
  // Find the index of the closest matching time
  const timeIndex = forecastData.hourly.time.findIndex(time => 
    time.startsWith(tonightIsoWithoutSeconds)
  );
  
  if (timeIndex === -1) {
    // If exact match not found, try to find the closest available hour
    const hourlyTimes = forecastData.hourly.time;
    const targetTime = tonight.getTime();
    
    // Find the closest time
    let closestIndex = 0;
    let closestDiff = Infinity;
    
    for (let i = 0; i < hourlyTimes.length; i++) {
      const hourTime = new Date(hourlyTimes[i]).getTime();
      const diff = Math.abs(hourTime - targetTime);
      
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }
    
    // If closest time is within 3 hours of target, use it
    if (closestDiff <= 3 * 60 * 60 * 1000) {
      return forecastData.hourly.cloudcover[closestIndex];
    }
    
    return null;
  }
  
  return forecastData.hourly.cloudcover[timeIndex];
}

/**
 * Calculate average cloud cover for nighttime hours
 * 
 * @param forecastData The full forecast data object
 * @returns Object with average cloud cover and time range
 */
export function calculateNighttimeCloudCover(
  forecastData: ForecastData | null
): { average: number; timeRange: string } | null {
  if (!forecastData?.hourly?.time || !forecastData.hourly.cloudcover) {
    return null;
  }
  
  // Define nighttime hours (7pm to 6am)
  const nightHours = [19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6];
  
  // Get today's date
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
  
  // Collect cloud cover for nighttime hours
  const cloudValues: number[] = [];
  
  forecastData.hourly.time.forEach((time, index) => {
    const hour = new Date(time).getHours();
    const date = time.split('T')[0];
    
    // Only include if it's nighttime hours for today or tomorrow
    if (nightHours.includes(hour) && (date === today || date === tomorrow)) {
      cloudValues.push(forecastData.hourly.cloudcover[index]);
    }
  });
  
  if (cloudValues.length === 0) {
    return null;
  }
  
  // Calculate average
  const average = Math.round(
    cloudValues.reduce((sum, val) => sum + val, 0) / cloudValues.length
  );
  
  return {
    average,
    timeRange: "19:00-06:00"
  };
}

/**
 * Gets the best astronomical hour for observation based on cloud cover
 * 
 * @param forecastData The forecast data object
 * @returns The hour with lowest cloud cover (0-23) or null if not available
 */
export function getBestAstronomicalHour(forecastData: ForecastData | null): number | null {
  if (!forecastData?.hourly?.time || !forecastData.hourly.cloudcover) {
    return null;
  }
  
  // Define night hours for astronomy (typically 8pm to 5am)
  const nightHours = [20, 21, 22, 23, 0, 1, 2, 3, 4, 5];
  
  // Get today and tomorrow date strings
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
  
  // Map of hours to their cloud cover values
  const hourlyCloudCover: { hour: number; cloudCover: number }[] = [];
  
  forecastData.hourly.time.forEach((time, index) => {
    const date = new Date(time);
    const hour = date.getHours();
    const dateStr = time.split('T')[0];
    
    // Only include night hours for today or tomorrow
    if (nightHours.includes(hour) && (dateStr === today || dateStr === tomorrow)) {
      hourlyCloudCover.push({
        hour,
        cloudCover: forecastData.hourly.cloudcover[index]
      });
    }
  });
  
  if (hourlyCloudCover.length === 0) {
    return null;
  }
  
  // Find the hour with the lowest cloud cover
  const bestHour = hourlyCloudCover.reduce((best, current) => 
    current.cloudCover < best.cloudCover ? current : best
  );
  
  return bestHour.hour;
}

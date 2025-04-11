
/**
 * Utility to fetch forecast data for SIQS calculation
 */

/**
 * Fetch forecast data for a specific location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Forecast data or null if unavailable
 */
export const fetchForecastForLocation = async (
  latitude: number, 
  longitude: number
): Promise<any | null> => {
  try {
    // Fetch forecast data from API
    const response = await fetch(`/api/forecast?lat=${latitude}&lon=${longitude}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch forecast: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Validate data structure
    if (!data || !data.hourly || !Array.isArray(data.hourly)) {
      console.warn("Invalid forecast data structure", data);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    return null;
  }
};

/**
 * Get nighttime hours from forecast data
 * @param forecastData Forecast data from API
 * @returns Array of nighttime forecast hours
 */
export const getNighttimeForecast = (forecastData: any): any[] => {
  if (!forecastData || !forecastData.hourly || !Array.isArray(forecastData.hourly)) {
    return [];
  }
  
  // Filter for nighttime hours (rough estimate - would be better with actual sunset/sunrise)
  const nighttimeHours = forecastData.hourly.filter((hour: any) => {
    if (!hour.dt) return false;
    
    const date = new Date(hour.dt * 1000);
    const hourOfDay = date.getHours();
    
    // Consider hours between 8 PM and 5 AM as nighttime
    return hourOfDay >= 20 || hourOfDay < 5;
  });
  
  return nighttimeHours;
};

/**
 * Calculate average cloud cover for nighttime hours
 * @param forecastData Forecast data
 * @returns Average nighttime cloud cover or null if unavailable
 */
export const getNighttimeCloudCover = (forecastData: any): number | null => {
  const nighttimeHours = getNighttimeForecast(forecastData);
  
  if (!nighttimeHours || nighttimeHours.length === 0) {
    return null;
  }
  
  // Calculate average cloud cover for nighttime hours
  const totalCloudCover = nighttimeHours.reduce((sum, hour) => {
    return sum + (hour.clouds || 0);
  }, 0);
  
  return totalCloudCover / nighttimeHours.length;
};

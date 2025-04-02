
/**
 * Filter forecast data to include only nighttime hours (6 PM to 7 AM)
 * @param forecasts Array of forecast items
 * @returns Array of nighttime forecast items
 */
export const filterNighttimeForecasts = (forecasts: any[]): any[] => {
  if (!forecasts || !Array.isArray(forecasts) || forecasts.length === 0) return [];
  
  return forecasts.filter(item => {
    if (!item.time) return false;
    const date = new Date(item.time);
    const hour = date.getHours();
    return hour >= 18 || hour < 7; // 6 PM to 7 AM
  });
};

/**
 * Extract hourly forecast data and convert to a standard format for processing
 * @param forecastData Raw forecast data from API
 * @returns Array of standardized forecast items
 */
export const extractHourlyForecastData = (forecastData: any): any[] => {
  if (!forecastData?.hourly || !Array.isArray(forecastData.hourly.time)) {
    return [];
  }
  
  const hourlyData = forecastData.hourly;
  const forecasts = [];
  
  for (let i = 0; i < hourlyData.time.length; i++) {
    forecasts.push({
      time: hourlyData.time[i],
      cloudCover: hourlyData.cloud_cover?.[i] ?? 0,
      windSpeed: hourlyData.wind_speed_10m?.[i] ?? 0,
      humidity: hourlyData.relative_humidity_2m?.[i] ?? 0,
      precipitation: hourlyData.precipitation?.[i] ?? 0,
      weatherCode: hourlyData.weather_code?.[i] ?? 0
    });
  }
  
  return forecasts;
};

/**
 * Helper function to calculate SIQS from an array of forecasts
 * @param forecasts Array of forecast objects
 * @returns Average SIQS score from forecast data
 */
export function getForecastSIQSFromArray(forecasts: any[]): number {
  if (!Array.isArray(forecasts) || forecasts.length === 0) {
    return 0;
  }
  
  // Filter to only include the first day's forecast (tonight)
  const today = new Date();
  const todayForecasts = forecasts.filter(forecast => {
    if (!forecast.date) return false;
    
    const forecastDate = new Date(forecast.date);
    return forecastDate.getDate() === today.getDate() || 
           (forecastDate.getDate() === today.getDate() + 1 && 
            new Date(forecast.date).getHours() < 7);
  });
  
  if (todayForecasts.length === 0) return 0;
  
  // Calculate average SIQS from forecast rows
  let totalSIQS = 0;
  let count = 0;
  
  todayForecasts.forEach(forecast => {
    // Check different possible locations for SIQS data
    const siqs = forecast.siqs?.score || forecast.siqsScore || forecast.siqs;
    
    if (siqs !== undefined && siqs !== null && !isNaN(parseFloat(siqs))) {
      totalSIQS += parseFloat(siqs);
      count++;
    } else if (forecast.cloudCover !== undefined || forecast.cloud_cover !== undefined) {
      // Fallback: calculate from cloud cover if available
      const cloudCover = forecast.cloudCover || forecast.cloud_cover;
      if (cloudCover < 50) {
        // Adjusted formula to match our new threshold
        // 0% clouds = 10, 50% clouds = 0
        const cloudScore = Math.max(0, 10 - (cloudCover * 0.2));
        totalSIQS += cloudScore;
        count++;
      }
    }
  });
  
  return count > 0 ? totalSIQS / count : 0;
}

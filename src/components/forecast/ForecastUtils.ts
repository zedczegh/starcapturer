
/**
 * Utilities for forecast display
 */

/**
 * Extract future forecasts from forecast data
 */
export function extractFutureForecasts(forecastData: any): any[] {
  if (!forecastData || !forecastData.hourly || !forecastData.hourly.time) {
    return [];
  }
  
  const now = new Date();
  const futureForecasts = [];
  
  const times = forecastData.hourly.time;
  const temps = forecastData.hourly.temperature_2m || [];
  const humidity = forecastData.hourly.relative_humidity_2m || [];
  const precip = forecastData.hourly.precipitation || [];
  const clouds = forecastData.hourly.cloud_cover || [];
  const wind = forecastData.hourly.wind_speed_10m || [];
  const weatherCodes = forecastData.hourly.weather_code || [];
  
  for (let i = 0; i < times.length; i++) {
    const forecastTime = new Date(times[i]);
    
    // Only include future times
    if (forecastTime > now) {
      futureForecasts.push({
        time: times[i],
        temperature: temps[i],
        humidity: humidity[i],
        precipitation: precip[i],
        cloudCover: clouds[i],
        windSpeed: wind[i],
        weatherCode: weatherCodes[i]
      });
    }
  }
  
  return futureForecasts;
}

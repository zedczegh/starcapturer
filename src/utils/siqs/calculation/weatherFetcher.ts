
/**
 * API functions for fetching weather and forecast data
 */

/**
 * Simplified API to fetch weather data
 */
export async function fetchWeatherData({ latitude, longitude }: { latitude: number; longitude: number }): Promise<any> {
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m&timezone=auto`);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      temperature: data.current?.temperature_2m || 15,
      humidity: data.current?.relative_humidity_2m || 50,
      precipitation: data.current?.precipitation || 0,
      cloudCover: data.current?.cloud_cover || 50,
      windSpeed: data.current?.wind_speed_10m || 5,
      latitude,
      longitude
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

/**
 * Simplified API to fetch forecast data
 */
export async function fetchForecastData({ latitude, longitude }: { latitude: number; longitude: number; days?: number }): Promise<any> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,cloud_cover,precipitation_probability&forecast_days=2&timezone=auto`
    );
    
    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    return null;
  }
}

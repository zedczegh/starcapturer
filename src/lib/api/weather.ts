
/**
 * API functions for weather data
 */
import { fetchWithTimeout } from './fetchUtils';
import { Coordinates, validateCoordinates } from './coordinates';

/**
 * Fetch weather data
 */
export async function fetchWeatherData(coordinates: Coordinates): Promise<any | null> {
  try {
    const validCoords = validateCoordinates(coordinates);
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${validCoords.latitude}&longitude=${validCoords.longitude}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m` +
      `&timezone=auto`;
    
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`Weather API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the data to a more usable format
    return {
      temperature: data.current?.temperature_2m || 0,
      humidity: data.current?.relative_humidity_2m || 0,
      precipitation: data.current?.precipitation || 0,
      cloudCover: data.current?.cloud_cover || 0,
      windSpeed: data.current?.wind_speed_10m || 0,
      time: data.current?.time || new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

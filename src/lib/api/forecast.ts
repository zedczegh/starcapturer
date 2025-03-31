
import { Coordinates, validateCoordinates } from './coordinates';

/**
 * Fetches forecast data for a specific location
 */
export async function fetchForecastData(coordinates: Coordinates, signal?: AbortSignal): Promise<any | null> {
  try {
    const validCoords = validateCoordinates(coordinates);
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${validCoords.latitude}&longitude=${validCoords.longitude}` +
      `&hourly=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,weather_code` +
      `&forecast_days=${validCoords.days || 3}&timezone=auto`;
    
    const response = await fetch(url, { signal });
    
    if (!response.ok) {
      throw new Error(`Forecast API responded with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Forecast data fetch aborted');
      throw error;
    }
    console.error("Error fetching forecast data:", error);
    return null;
  }
}

/**
 * Fetches long range forecast data for a specific location
 */
export async function fetchLongRangeForecastData(coordinates: Coordinates, signal?: AbortSignal): Promise<any | null> {
  try {
    const validCoords = validateCoordinates(coordinates);
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${validCoords.latitude}&longitude=${validCoords.longitude}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,` +
      `wind_speed_10m_max,relative_humidity_2m_mean,cloud_cover_mean,weather_code` +
      `&forecast_days=${validCoords.days || 16}&timezone=auto`;
    
    const response = await fetch(url, { signal });
    
    if (!response.ok) {
      throw new Error(`Long range forecast API responded with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Long range forecast data fetch aborted');
      throw error;
    }
    console.error("Error fetching long range forecast data:", error);
    return null;
  }
}

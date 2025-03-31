
import { Coordinates, validateCoordinates } from './coordinates';

/**
 * Fetches forecast data for a specific location
 */
export async function fetchForecastData(coordinates: Coordinates, signal?: AbortSignal): Promise<any | null> {
  try {
    const validCoords = validateCoordinates(coordinates);
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${validCoords.latitude}&longitude=${validCoords.longitude}` +
      `&hourly=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset,weathercode` +
      `&forecast_days=${validCoords.days || 3}&timezone=auto`;
    
    console.log('Fetching forecast from URL:', url);
    
    const response = await fetch(url, { signal });
    
    if (!response.ok) {
      throw new Error(`Forecast API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform data to match expected format for daily forecasts
    if (data && data.daily) {
      // Create a transformed format for the daily forecast data
      const transformedDaily = [];
      
      for (let i = 0; i < data.daily.time.length; i++) {
        transformedDaily.push({
          time: data.daily.time[i],
          weatherCode: data.daily.weathercode[i],
          temperatureMax: data.daily.temperature_2m_max[i],
          temperatureMin: data.daily.temperature_2m_min[i],
          sunrise: data.daily.sunrise[i],
          sunset: data.daily.sunset[i],
          precipitation: data.daily.precipitation_sum[i],
          cloudCover: 30, // Default value as it's not directly provided
          windSpeed: 5,   // Default value as it's not directly provided
          visibility: 10  // Default value as it's not directly provided
        });
      }
      
      // Add the transformed daily data back to the response
      data.daily = transformedDaily;
    }
    
    return data;
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
      `wind_speed_10m_max,weathercode,relative_humidity_2m_mean,cloud_cover_mean` +
      `&forecast_days=${validCoords.days || 16}&timezone=auto`;
    
    console.log('Fetching long range forecast from URL:', url);
    
    const response = await fetch(url, { signal });
    
    if (!response.ok) {
      throw new Error(`Long range forecast API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform data to match expected format for daily forecasts
    if (data && data.daily) {
      // Create a transformed format for the daily forecast data
      const transformedDaily = [];
      
      for (let i = 0; i < data.daily.time.length; i++) {
        transformedDaily.push({
          time: data.daily.time[i],
          weatherCode: data.daily.weathercode[i],
          temperatureMax: data.daily.temperature_2m_max[i],
          temperatureMin: data.daily.temperature_2m_min[i],
          precipitation: data.daily.precipitation_sum[i],
          cloudCover: data.daily.cloud_cover_mean ? data.daily.cloud_cover_mean[i] : 30,
          windSpeed: data.daily.wind_speed_10m_max[i],
          visibility: 10 // Default value
        });
      }
      
      // Add the transformed daily data back to the response
      data.daily = transformedDaily;
    }
    
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Long range forecast data fetch aborted');
      throw error;
    }
    console.error("Error fetching long range forecast data:", error);
    return null;
  }
}

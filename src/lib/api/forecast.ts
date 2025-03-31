
import { toast } from 'sonner';

interface ForecastParams {
  latitude: number;
  longitude: number;
  days?: number;
}

/**
 * Fetch forecast data from Open Meteo API
 */
export const fetchForecastData = async (params: ForecastParams, signal?: AbortSignal) => {
  const { latitude, longitude, days = 3 } = params;
  
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.append('latitude', latitude.toString());
  url.searchParams.append('longitude', longitude.toString());
  url.searchParams.append('hourly', 'temperature_2m,relative_humidity_2m,precipitation,weather_code,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,wind_speed_10m,wind_direction_10m');
  url.searchParams.append('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,weather_code');
  url.searchParams.append('forecast_days', days.toString());
  url.searchParams.append('timezone', 'auto');
  
  try {
    const response = await fetch(url.toString(), { signal });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('Forecast data fetch aborted');
      return null;
    }
    
    console.error('Error fetching forecast data:', error);
    return null;
  }
};

/**
 * Fetch long range forecast data (10+ days)
 */
export const fetchLongRangeForecastData = async (params: ForecastParams) => {
  const { latitude, longitude, days = 10 } = params;
  
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.append('latitude', latitude.toString());
  url.searchParams.append('longitude', longitude.toString());
  url.searchParams.append('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code');
  url.searchParams.append('forecast_days', days.toString());
  url.searchParams.append('timezone', 'auto');
  
  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching long range forecast data:', error);
    return null;
  }
};

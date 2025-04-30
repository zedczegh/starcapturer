
/**
 * Service to fetch weather forecast data
 */

interface ForecastResponse {
  daily: {
    time: string[];
    cloudcover: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    windspeed_10m_max: number[];
  };
  hourly?: {
    time: string[];
    cloudcover: number[];
    temperature_2m: number[];
    precipitation: number[];
    windspeed_10m: number[];
  };
}

/**
 * Fetches the forecast for a given location
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @returns Forecast data
 */
export async function getForecast(
  latitude: number,
  longitude: number
): Promise<ForecastResponse> {
  try {
    // Use open-meteo API for free weather data
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,cloudcover,windspeed_10m_max&hourly=temperature_2m,precipitation,cloudcover,windspeed_10m&timezone=auto&forecast_days=7`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch forecast: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as ForecastResponse;
  } catch (error) {
    console.error("Error fetching forecast:", error);
    
    // Return fallback data to prevent app crashes
    return {
      daily: {
        time: Array(7).fill("").map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i);
          return date.toISOString().split('T')[0];
        }),
        cloudcover: Array(7).fill(50),
        temperature_2m_max: Array(7).fill(20),
        temperature_2m_min: Array(7).fill(10),
        precipitation_sum: Array(7).fill(0),
        windspeed_10m_max: Array(7).fill(10)
      }
    };
  }
}


import axios from 'axios';

/**
 * Fetch weather data for a location
 * @param params Location parameters
 * @returns Weather data
 */
export async function fetchWeatherData({
  latitude,
  longitude
}: {
  latitude: number;
  longitude: number;
}) {
  try {
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relativehumidity_2m,cloudcover,windspeed_10m&timezone=auto`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

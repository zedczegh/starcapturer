
import { IWeatherService, WeatherData, ForecastData } from '../interfaces/IWeatherService';
import { ConfigManager } from '../config/AppConfig';

export class OpenMeteoWeatherService implements IWeatherService {
  private config = ConfigManager.getInstance().getWeatherConfig();

  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      // Use existing weather fetching logic
      const { fetchWeatherData } = await import('@/lib/api');
      const weatherData = await fetchWeatherData({ latitude, longitude });
      
      if (!weatherData) {
        throw new Error('Failed to fetch weather data');
      }

      return {
        cloudCover: weatherData.cloudCover,
        windSpeed: weatherData.windSpeed,
        humidity: weatherData.humidity,
        temperature: weatherData.temperature,
        weatherCondition: weatherData.weatherCondition,
        precipitation: weatherData.precipitation,
        aqi: weatherData.aqi
      };
    } catch (error) {
      console.error('OpenMeteo weather service error:', error);
      throw error;
    }
  }

  async getForecast(latitude: number, longitude: number): Promise<ForecastData> {
    try {
      // Use existing forecast fetching logic
      const { fetchForecastData } = await import('@/lib/api');
      const forecastData = await fetchForecastData(latitude, longitude);
      
      if (!forecastData) {
        throw new Error('Failed to fetch forecast data');
      }

      return {
        forecasts: forecastData.map((item: any) => ({
          date: item.date,
          cloudCover: item.cloudCover,
          conditions: item.conditions,
          temperature: item.temperature,
          humidity: item.humidity,
          windSpeed: item.windSpeed
        }))
      };
    } catch (error) {
      console.error('OpenMeteo forecast service error:', error);
      throw error;
    }
  }

  getProvider(): string {
    return 'openmeteo';
  }
}

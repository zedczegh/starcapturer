
export interface WeatherData {
  cloudCover: number;
  windSpeed: number;
  humidity: number;
  temperature: number;
  weatherCondition: string;
  precipitation: number;
  aqi?: number;
}

export interface ForecastData {
  forecasts: Array<{
    date: string;
    cloudCover: number;
    conditions: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
  }>;
}

export interface IWeatherService {
  getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData>;
  getForecast(latitude: number, longitude: number): Promise<ForecastData>;
  getProvider(): string;
}

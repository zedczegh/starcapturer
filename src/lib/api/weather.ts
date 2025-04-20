import { validateCoordinates } from './coordinates';

export interface WeatherResponse {
  current_weather?: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    time: string;
  };
  current?: {
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    cloud_cover: number;
    wind_speed_10m: number;
    weather_code: number;
    time: string;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    cloud_cover: number[];
    weather_code?: number[];
    precipitation: number[];
    windspeed_10m?: number[];
    wind_speed_10m?: number[];
    relative_humidity_2m?: number[];
  };
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation: number;
  time: string;
  condition: string;
  weatherCondition?: string;
  aqi?: number;
  nighttimeCloudData?: {
    average: number;
    timeRange?: string;
    sourceType?: string;
    evening?: number | null;
    morning?: number | null;
  };
}

// Weather code mapping to text descriptions
export const weatherConditions: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail"
};

/**
 * Determine weather condition based on cloud cover
 */
export function determineWeatherCondition(cloudCover: number): string {
  if (cloudCover < 10) return "Clear";
  if (cloudCover < 30) return "Mostly Clear";
  if (cloudCover < 60) return "Partly Cloudy";
  if (cloudCover < 80) return "Mostly Cloudy";
  return "Overcast";
}

/**
 * Fetches current weather data for a specific location
 */
export async function fetchWeatherData(
  { latitude, longitude }: { latitude: number; longitude: number; days?: number }, 
  signal?: AbortSignal
): Promise<WeatherData | null> {
  try {
    const coords = validateCoordinates({ latitude, longitude });
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m,weather_code` +
      `&hourly=cloud_cover&timezone=auto`;
    
    const response = await fetch(url, { signal });
    
    if (!response.ok) {
      throw new Error(`Weather API responded with status ${response.status}`);
    }
    
    const data: WeatherResponse = await response.json();
    
    if (!data.current) {
      throw new Error("Weather data format missing 'current' field");
    }
    
    // Create standardized weather data object
    const weatherData: WeatherData = {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      cloudCover: data.current.cloud_cover,
      windSpeed: data.current.wind_speed_10m,
      precipitation: data.current.precipitation,
      time: data.current.time,
      condition: weatherConditions[data.current.weather_code] || determineWeatherCondition(data.current.cloud_cover),
      weatherCondition: weatherConditions[data.current.weather_code] || "",
    };
    
    // Try to fetch AQI data
    try {
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coords.latitude}&longitude=${coords.longitude}` +
                    `&current=european_aqi&domains=cams_global`;
      
      const aqiResponse = await fetch(aqiUrl, { signal });
      
      if (aqiResponse.ok) {
        const aqiData = await aqiResponse.json();
        if (aqiData.current && aqiData.current.european_aqi !== undefined) {
          weatherData.aqi = aqiData.current.european_aqi;
        }
      }
    } catch (aqiError) {
      console.error("Error fetching AQI data:", aqiError);
    }
    
    return weatherData;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

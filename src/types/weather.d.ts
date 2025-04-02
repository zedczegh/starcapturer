declare interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  cloudCover: number;
  precipitation: number;
  weatherCondition: string;
  aqi?: number;
  skyBrightness?: {
    value: number;
    mpsas?: number;
    timestamp?: string;
  };
}

declare interface ForecastData {
  hourly: any[];
  daily: any[];
}

declare interface LocationData {
  latitude: number;
  longitude: number;
}

declare interface LocationWithWeather {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
  seeingConditions: number;
  weatherData: any;
  siqsResult: any;
  moonPhase: number;
  timestamp: string;
  skyBrightness?: {
    value: number;
    mpsas?: number;
    timestamp?: string;
  };
}

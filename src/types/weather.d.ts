
// Define types for weather data and related services

export interface WeatherData {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation?: number;
  time?: string;
  condition?: string;
  aqi?: number | null;
  weatherCondition?: string;
}

export interface ForecastItem {
  date: string;
  time?: string;
  temperature_min: number;
  temperature_max: number;
  temperature?: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation?: number;
  condition?: string;
  moonPhase?: number;
  moonIllumination?: number;
}

export interface SIQSScoreData {
  score: number;
  isViable: boolean;
  factors?: Array<{
    name: string;
    score: number;
    description: string;
  }>;
}

export interface SharedAstroSpot {
  id: string;
  name: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
  siqs: SIQSScoreData;
  isViable: boolean;
  distance?: number;
  timestamp: string;
}

export interface LocationData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  bortleScale?: number;
  seeingConditions?: number;
  moonPhase?: number;
  weatherData?: WeatherData;
  siqsResult?: SIQSScoreData;
}


export interface WeatherData {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation: number;
  weatherCondition: string;
  aqi: number;
}

export interface SIQSResult {
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
  latitude: number;
  longitude: number;
  timestamp: string;
  chineseName?: string;
  bortleScale?: number;
  siqs?: number;
  isViable?: boolean;
  distance?: number;
  description?: string;
  photoUrl?: string;
  photographer?: string;
  targets?: string[];
}

export interface ForecastItem {
  time: string;
  temperature: number;
  cloudCover: number;
  windSpeed: number;
  humidity: number;
  precipitation: number;
  weatherCondition: string;
}

export interface WeatherAlert {
  event: string;
  description: string;
  effective: string;
  expires: string;
}

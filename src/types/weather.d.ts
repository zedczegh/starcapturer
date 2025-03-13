
export interface WeatherData {
  cloudCover: number;
  windSpeed: number;
  humidity: number;
  temperature?: number;
  precipitation?: number;
  time?: string;
  condition?: string;
  weatherCondition?: string;
  aqi?: number | null;
}

export interface ForecastItem {
  time: string;
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation: number;
  condition: string;
  weatherIcon?: string;
}

export interface ForecastData {
  items: ForecastItem[];
  location: {
    name: string;
    country: string;
  };
}

export interface SharedAstroSpot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  bortleScale?: number;
  photographer?: string;
  photoUrl?: string;
  targets?: string[];
  siqs?: number;
  isViable?: boolean;
  timestamp?: string;
  distance?: number;
}

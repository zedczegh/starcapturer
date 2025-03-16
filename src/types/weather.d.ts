
export interface WeatherData {
  cloudCover: number;
  windSpeed: number;
  humidity: number;
  temperature?: number;
  precipitation?: number;
  weatherCondition?: string;
  aqi?: number;
  condition?: string;
  time?: string;
}

export interface ForecastData {
  hourly: {
    time: string[];
    temperature: number[];
    cloudCover: number[];
    precipitation: number[];
    windSpeed: number[];
    humidity: number[];
    weatherCode?: number[];
  };
  daily?: {
    time: string[];
    temperatureMax: number[];
    temperatureMin: number[];
    cloudCover: number[];
    precipitationProbability: number[];
    windSpeed: number[];
  };
}

export interface ForecastItem {
  time: string;
  temperature: number;
  cloudCover: number;
  precipitation: number;
  windSpeed: number;
  humidity: number;
  weatherCode?: number;
  siqsScore?: number;
}

export interface SharedAstroSpot {
  id: string;
  name: string;
  chineseName?: string; // Ensure the chineseName property is defined
  latitude: number;
  longitude: number;
  description: string;
  bortleScale: number;
  photographer: string;
  photoUrl: string;
  targets: string[];
  siqs: number;
  isViable: boolean;
  timestamp: string;
  distance?: number;
}

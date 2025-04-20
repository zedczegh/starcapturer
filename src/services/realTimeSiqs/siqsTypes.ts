
// Add this if the file doesn't exist or update it if it does

export interface WeatherDataWithClearSky {
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  cloudCover: number;
  precipitation?: number;
  aqi?: number;
  clearSkyRate?: number;
  latitude: number;
  longitude: number;
  _forecast?: any;
  nighttimeCloudData?: {
    average: number;
    timeRange: string;
    sourceType?: string;
  };
}

export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  weatherData?: WeatherDataWithClearSky;
  forecastData?: any;
  factors?: Array<{
    name: string;
    score: number;
    description: string;
  }>;
  metadata?: {
    calculatedAt: string;
    sources: {
      weather: boolean;
      forecast: boolean;
      clearSky: boolean;
      lightPollution: boolean;
      terrainCorrected?: boolean;
      climate?: boolean;
      singleHourSampling?: boolean;
    };
  };
}

export interface SiqsCalculationOptions {
  useSingleHourSampling?: boolean;
  targetHour?: number;
  cacheDurationMins?: number;
  skipApiCalls?: boolean;
  maxConcurrent?: number;
}

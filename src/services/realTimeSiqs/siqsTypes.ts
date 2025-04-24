
// SIQS Calculation Types

export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  factors?: any[];
  weatherData?: WeatherDataWithClearSky;
  forecastData?: any;
  metadata?: {
    calculatedAt: string;
    targetHour?: number;
    sources: {
      weather: boolean;
      forecast: boolean;
      clearSky: boolean;
      lightPollution: boolean;
      terrainCorrected?: boolean;
      climate?: boolean;
      singleHourSampling?: boolean;
    };
    reliability?: {
      score: number;
      issues: string[];
    };
  };
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  cloudCover: number;
  precipitation: number;
  windSpeed: number;
  aqi?: number;
  weatherCondition?: string;
  timestamp?: string;
}

export interface WeatherDataWithClearSky extends WeatherData {
  clearSkyRate?: number;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
}

export interface SiqsCalculationOptions {
  useSingleHourSampling?: boolean;
  targetHour?: number;
  cacheDurationMins?: number;
  includeMetadata?: boolean;
  forecastDays?: number;
  hourlyWeighting?: boolean;
  useHistoricalData?: boolean;
  useRealTimeData?: boolean;
}

export interface SiqsComparisonResult {
  score: number;
  comparison: 'better' | 'worse' | 'similar';
  percentDifference: number;
  factors?: {
    improved: string[];
    worsened: string[];
  };
}

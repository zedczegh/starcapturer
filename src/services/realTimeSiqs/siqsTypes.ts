
/**
 * Type definitions for SIQS calculation
 */

export interface WeatherDataWithClearSky {
  temperature: number;
  humidity: number;
  windSpeed: number;
  cloudCover: number;
  precipitation?: number;
  aqi?: number;
  clearSkyRate?: number;
  latitude?: number;
  longitude?: number;
  _forecast?: any;
  nighttimeCloudData?: {
    average: number;
    timeRange: string;
    sourceType?: "forecast" | "calculated" | "historical";
  };
}

export interface SiqsFactor {
  name: string;
  score: number;
  description?: string;
}

export interface SiqsMetadata {
  calculatedAt: string;
  sources?: {
    weather: boolean;
    forecast?: boolean;
    clearSky?: boolean;
    lightPollution?: boolean;
    terrainCorrected?: boolean;
    climate?: boolean;
    historicalData?: boolean;
    singleHourSampling?: boolean;
  };
  algorithm?: {
    version: string;
    adjustments?: string[];
  };
}

export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  factors?: SiqsFactor[];
  level?: string;
  weatherData?: WeatherDataWithClearSky;
  forecastData?: any;
  metadata?: SiqsMetadata;
  nighttimeCloudData?: any;
}

export interface SiqsCache {
  timestamp: number;
  result: SiqsResult;
}

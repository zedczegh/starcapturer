
/**
 * Type definitions for SIQS calculation and results
 */

export interface SiqsFactor {
  name: string;
  score: number;
  description: string; // Make this required instead of optional
  nighttimeData?: {
    average: number;
    timeRange: string;
    sourceType?: 'forecast' | 'calculated' | 'historical';
  };
}

export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  factors?: SiqsFactor[];
  metadata?: {
    calculatedAt?: string;
    sources?: {
      weather?: boolean;
      forecast?: boolean;
      clearSky?: boolean;
      lightPollution?: boolean;
      terrainCorrected?: boolean;
      climate?: boolean;
    };
    reliability?: {  // Add reliability field to metadata
      score: number;
      issues?: string[];
    };
  };
  forecastData?: any;
  weatherData?: WeatherDataWithClearSky;
}

export interface WeatherDataWithClearSky {
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  cloudCover: number;
  precipitation?: number;
  visibility?: number;
  clearSkyRate?: number;
  latitude: number;
  longitude: number;
  aqi?: number;
  nighttimeCloudData?: {
    average: number;
    timeRange: string;
    sourceType?: 'forecast' | 'calculated' | 'historical';
  };
  _forecast?: any;
}

export interface SiqsLocationInfo {
  latitude: number;
  longitude: number;
  bortleScale?: number;
  seeingConditions?: number;
  moonPhase?: number;
}

// Add missing interfaces

export interface MoonPhaseInfo {
  phase: number;
  name: string;
  illumination: number;
  isGoodForAstronomy: boolean;
}

export interface SiqsCalculationOptions {
  anomalyDetection?: boolean;
  includeMetadata?: boolean;
  includeForecast?: boolean;
}

export interface MoonlessNightInfo {
  date: Date;
  startTime: Date;
  endTime: Date;
  durationHours: number;
}

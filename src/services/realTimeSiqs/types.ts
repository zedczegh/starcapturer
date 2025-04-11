
/**
 * Types for the realTimeSiqs service
 */

export interface SiqsFactors {
  name: string;
  value: number;
  weight: number;
  description?: string;
}

export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  factors?: SiqsFactors[];
}

export interface SiqsCacheEntry {
  siqs: number;
  timestamp: number;
  isViable: boolean;
  factors?: SiqsFactors[];
}

export interface WeatherDataWithClearSky extends Record<string, any> {
  cloudCover: number;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  precipitation?: number;
  weatherCondition?: string;
  aqi?: number;
  clearSkyRate?: number;
}

export interface BatchProcessOptions {
  maxParallel?: number;
  prioritizeDarkSky?: boolean;
}

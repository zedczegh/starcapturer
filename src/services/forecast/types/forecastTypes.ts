
/**
 * Types for forecast services
 */

import { SiqsResult } from "../../realTimeSiqs/siqsTypes";

/**
 * Interface for forecast day astronomical data
 */
export interface ForecastDayAstroData {
  date: string;
  dayIndex: number;
  cloudCover: number;
  siqs: number | null;
  isViable: boolean;
  temperature: {
    min: number;
    max: number;
  };
  precipitation: {
    probability: number;
    amount: number | null;
  };
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  siqsResult?: SiqsResult | null;
  reliability?: number;
}

/**
 * Interface for batch location data with additional forecast properties
 */
export interface BatchLocationData {
  latitude: number;
  longitude: number;
  bortleScale?: number;
  name?: string;
  forecastDay: number;
  priority: number;
  cloudCover?: number;
}

/**
 * Interface for forecast caching
 */
export interface ForecastCacheItem {
  data: any;
  timestamp: number;
}

/**
 * Interface for batch processing result
 */
export interface BatchForecastResult {
  location: { 
    latitude: number; 
    longitude: number; 
    name?: string 
  };
  forecast: ForecastDayAstroData[] | ForecastDayAstroData | null;
  success: boolean;
}

/**
 * Extended SiqsResult with additional properties used in map integration
 */
export interface ExtendedSiqsResult extends SiqsResult {
  bortleScale?: number;
}


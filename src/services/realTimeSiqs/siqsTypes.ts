
/**
 * Type definitions for SIQS calculation
 */

export interface WeatherData {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation?: number;
  aqi?: number;
  condition?: string;
  [key: string]: any; // Allow for additional weather properties
}

export interface WeatherDataWithClearSky extends WeatherData {
  clearSky: number;
}

export interface SiqsFactor {
  name: string;
  score: number;
  description: string;
  value?: number | string;
}

export interface SiqsMetadata {
  timestamp: string;
  bortleScale: number;
  weatherSnapshot: any;
}

export interface SiqsResult {
  siqs: number;
  score: number;
  isViable: boolean;
  factors?: SiqsFactor[];
  metadata?: SiqsMetadata;
}

export interface SiqsCalculationOptions {
  includeFactors?: boolean;
  includeMetadata?: boolean;
  anomalyDetection?: boolean;
}

export interface EnhancedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
  elevation?: number;
  weatherData?: WeatherData;
  siqs?: number;
  siqsResult?: SiqsResult;
  timestamp: string;
  [key: string]: any; // Allow for additional properties
}

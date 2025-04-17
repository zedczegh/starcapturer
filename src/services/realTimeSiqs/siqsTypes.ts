
/**
 * Type definitions for SIQS calculations
 */

export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  factors?: SiqsFactor[];
}

export interface SiqsFactor {
  name: string;
  score: number;
  description?: string;
  source?: string;
  value?: number;
}

export interface ClimateRegion {
  name: string;
  region: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  conditions: {
    humidity: number;
    temperature: number;
    cloudCover: number;
  };
  adjustmentFactors: number[];
}

export interface EnhancedLocation {
  name: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  elevation?: number;
  timestamp?: string;
  weatherData?: WeatherData;
  seeingConditions?: number;
  averageVisibility?: number;
  lightPollutionData?: any;
  hasDarkSkyStatus?: boolean;
  certification?: string;
  siqsResult?: SiqsResult;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed?: number;
  precipitation?: number;
  time?: string;
  condition?: string;
  clearSky?: number;
  aqi?: number;
}

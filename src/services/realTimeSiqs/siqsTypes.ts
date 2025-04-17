
/**
 * Type definitions for SIQS calculations
 */

export interface SiqsResult {
  siqs: number;
  score: number; // Added score property for compatibility
  isViable: boolean;
  factors?: SiqsFactor[];
  metadata?: Record<string, any>; // Added metadata property
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
  id: string;
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
  isDarkSkyReserve?: boolean;
  clearSkyRate?: number;
  seasonalTrends?: Record<string, { clearSkyRate: number, averageTemperature: number }>;
  bestMonths?: string[];
  annualPrecipitationDays?: number;
  characteristics?: string[];
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

export interface WeatherDataWithClearSky extends WeatherData {
  clearSky: number;
  latitude?: number; // Added for compatibility
  longitude?: number; // Added for compatibility
}

export interface SiqsCalculationOptions {
  includeFactors?: boolean;
  adjustForSeasonality?: boolean;
  adjustForTime?: boolean;
  adjustForElevation?: boolean;
  includeMetadata?: boolean;
  locale?: string;
  anomalyDetection?: boolean; // Added for compatibility
}

export interface MoonlessNightInfo {
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
}


/**
 * Type definitions for SIQS calculation
 */

export interface ClimateRegion {
  id: string;
  name: string;
  borders: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  adjustmentFactors: {
    humidity: number;
    temperature: number;
    cloudCover: number;
  };
}

export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  factors?: {
    name: string;
    score: number;
    description: string;
  }[];
}

export interface WeatherDataWithClearSky {
  temperature: number;
  humidity: number;
  cloudCover: number;
  clearSky?: number;
  windSpeed: number; // Making this required since it's used in calculations
  precipitation?: number;
  [key: string]: any;
}

/**
 * Enhanced location data with additional astronomy information
 */
export interface EnhancedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  clearSkyRate?: number;
  siqsScore?: number;
  weatherData?: WeatherDataWithClearSky;
  distance?: number;
  timestamp?: string;
  isDarkSkyReserve?: boolean; // Added to fix error
}

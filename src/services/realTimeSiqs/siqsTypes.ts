
/**
 * Type definitions for SIQS calculation
 */

export interface ClimateRegion {
  id: string;
  name: string;
  borders?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  adjustmentFactors?: {
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
  windSpeed?: number;
  precipitation?: number;
  [key: string]: any;
}

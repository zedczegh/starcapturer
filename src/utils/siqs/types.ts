
/**
 * Unified SIQS types for consistent usage across the application
 */

// Basic SIQS score representation
export type SiqsScore = number | { score: number; isViable: boolean; factors?: SiqsFactor[] };

// SIQS factor information
export interface SiqsFactor {
  name: string;
  score: number;
  description?: string;
  nighttimeData?: any;
}

// SIQS calculation options
export interface SiqsCalculationOptions {
  useSingleHourSampling?: boolean;
  targetHour?: number;
  cacheDurationMins?: number;
  skipCache?: boolean;
}

// SIQS calculation result
export interface SiqsCalculationResult {
  siqs: number;
  isViable: boolean;
  factors?: SiqsFactor[];
  source?: 'realtime' | 'cached' | 'default';
  metadata?: {
    calculatedAt: string;
    sources?: {
      weather?: boolean;
      forecast?: boolean;
      clearSky?: boolean;
      lightPollution?: boolean;
      terrainCorrected?: boolean;
      climate?: boolean;
      singleHourSampling?: boolean;
    };
    reliability?: {
      score: number;
      issues?: string[];
    }
  };
  weatherData?: any;
  forecastData?: any;
}

// Common interface for location objects with SIQS
export interface SiqsLocation {
  latitude: number;
  longitude: number;
  siqs?: SiqsScore;
  bortleScale?: number;
  certification?: string;
  isDarkSkyReserve?: boolean;
}


/**
 * Type definitions for the enhanced real-time SIQS system
 */

import { WeatherData } from '@/lib/api/weather';

// Extended weather data with clear sky rate
export interface WeatherDataWithClearSky extends WeatherData {
  clearSkyRate?: number;
}

// SIQS calculation result
export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  factors?: SiqsFactor[];
  metadata?: SiqsMetadata;
}

// Individual factor in SIQS calculation
export interface SiqsFactor {
  name: string;
  score: number;
  description: string; // Changed from optional to required
  nighttimeData?: any;
}

// Metadata about SIQS calculation
export interface SiqsMetadata {
  calculatedAt: string; // This is required
  sources: {
    weather: boolean;
    forecast: boolean;
    clearSky: boolean;
    lightPollution: boolean;
  };
  reliability?: {
    score: number;
    issues?: string[];
  };
}

// Terrain information for advanced calculations
export interface TerrainData {
  elevation: number;
  slope?: number;
  aspect?: number;
  nearestPeakDistance?: number;
  surroundingElevationProfile?: number[];
}

// Cache control options
export interface SiqsCacheOptions {
  maxAge?: number; // Maximum age in minutes
  bypassCache?: boolean; // Force recalculation
  storeResult?: boolean; // Whether to store the result in cache
}

// SIQS calculation options
export interface SiqsCalculationOptions extends SiqsCacheOptions {
  includeFactors?: boolean; // Whether to include factor details
  includeMetadata?: boolean; // Whether to include metadata
  prioritizeAccuracy?: boolean; // Whether to prioritize accuracy over speed
  anomalyDetection?: boolean; // Whether to enable anomaly detection
}

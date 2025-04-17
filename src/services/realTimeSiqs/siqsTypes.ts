
/**
 * Types for SIQS (Sky Imaging Quality Score) system
 */

/**
 * Moon phase information
 */
export interface MoonPhaseInfo {
  phase: number; // 0-1 representing full cycle
  illumination: number; // 0-1 representing illumination
  name: string; // Named phase (e.g., "Full Moon", "Waxing Crescent")
  date?: string; // Optional ISO date string
}

/**
 * Result of SIQS calculation
 */
export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  factors?: Array<{
    name: string;
    score: number;
    description?: string;
    nighttimeData?: any;
  }>;
  metadata?: {
    calculatedAt: string;
    sources?: {
      weather: boolean;
      forecast: boolean;
      clearSky: boolean;
      lightPollution: boolean;
    };
    reliability?: {
      score: number;
      issues: string[];
    }
  };
}

/**
 * Weather data with coordinates
 */
export interface WeatherDataWithClearSky {
  latitude: number;
  longitude: number;
  cloudCover?: number;
  humidity?: number;
  temperature?: number;
  clearSkyRate?: number;
  precipitation?: number;
  time?: string;
  condition?: string;
  _forecast?: any;
}

/**
 * Options for SIQS calculation
 */
export interface SiqsCalculationOptions {
  anomalyDetection?: boolean;
  includeMetadata?: boolean;
  useForecast?: boolean;
}

/**
 * Enhanced location with additional data
 */
export interface EnhancedLocation {
  name?: string;
  latitude: number;
  longitude: number;
  clearSkyRate?: number;
  bortleScale?: number;
  timestamp?: string;
  [key: string]: any;
}

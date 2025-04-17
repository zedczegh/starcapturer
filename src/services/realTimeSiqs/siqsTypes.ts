
/**
 * Types for SIQS calculation
 */

// Weather data enhanced with clear sky information
export interface WeatherDataWithClearSky {
  temperature: number;
  humidity: number;
  cloudCover: number;
  visibility: number;
  windSpeed: number;
  moonPhase: number;
  clearSkyRate: number;
  rain?: number;
  snow?: number;
  precipitation?: number;  // Added for compatibility
  time?: string;          // Added timestamp
  latitude?: number;      // Added for location reference
  longitude?: number;     // Added for location reference
  _forecast?: any;        // Added for forecast data reference
}

// SIQS calculation result
export interface SiqsResult {
  score: number;          // Primary SIQS score
  siqs?: number;          // Legacy field for backward compatibility
  isViable: boolean;
  factors?: Array<{
    name: string;
    score: number;
    description: string;
  }>;
  metadata?: {
    calculatedAt?: string;
    sources?: {
      weather: boolean;
      forecast: boolean;
      clearSky: boolean;
      lightPollution: boolean;
    };
    reliability?: {
      confidenceScore: number;
      issues: string[];
    };
  };
}

// SIQS location result
export interface SiqsLocationResult {
  siqs: number;
  isViable: boolean;
  id: string;
  name: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
  distance?: number;
  description?: string;
  certification?: string;
  isDarkSkyReserve?: boolean;
  timestamp: string;
  type?: string;
  siqsResult?: SiqsResult;
}

// Moon phase information
export interface MoonPhaseInfo {
  phase: number;
  illumination: number;
  name: string;
  isNewMoon: boolean;
  isFullMoon: boolean;
}

// Moon night info used in moonUtils.ts
export interface MoonlessNightInfo {
  duration: number;
  startTime: string;
  endTime: string;
  moonrise: Date | string;
  moonset: Date | string;
  nextNewMoon: string;
  daysUntilNewMoon: number;
  astronomicalNightStart: string;
  astronomicalNightEnd: string;
  astronomicalNightDuration: number;
}

// SIQS calculation options
export interface SiqsCalculationOptions {
  anomalyDetection?: boolean;
  includeMetadata?: boolean;
  cacheDuration?: number;
}


/**
 * Extended WeatherData interface with clearSkyRate
 */
export interface WeatherDataWithClearSky extends Record<string, any> {
  cloudCover: number;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  precipitation?: number;
  weatherCondition?: string;
  aqi?: number;
  clearSkyRate?: number;
}

/**
 * Cache entry for SIQS data
 */
export interface SiqsCacheEntry {
  siqs: number;
  timestamp: number;
  isViable: boolean;
  factors?: any[];
}

/**
 * Result of SIQS calculation
 */
export interface SiqsCalculationResult {
  siqs: number;
  isViable: boolean;
  factors?: any[];
}

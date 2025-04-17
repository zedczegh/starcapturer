
/**
 * Result of SIQS calculation
 */
export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  factors?: {
    name: string;
    score: number;
    description?: string;
  }[];
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
    };
  };
}

/**
 * Options for SIQS calculation
 */
export interface SiqsCalculationOptions {
  anomalyDetection?: boolean;
  includeMetadata?: boolean;
}

/**
 * Weather data with clear sky information
 */
export interface WeatherDataWithClearSky {
  latitude: number;
  longitude: number;
  hourly?: {
    time: string[];
    temperature_2m?: number[];
    relativehumidity_2m?: number[];
    cloudcover?: number[];
    windspeed_10m?: number[];
  };
  current_weather?: {
    temperature: number;
    windspeed: number;
    weathercode: number;
  };
  clearSkyRate?: number;
}

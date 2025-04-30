
/**
 * Forecast service type definitions
 */

export interface ForecastCacheItem {
  data: any;
  timestamp: number;
}

export interface ForecastDayAstroData {
  date: string;
  dayIndex: number;
  cloudCover: number;
  siqs: number | null;
  isViable: boolean;
  temperature: {
    min: number;
    max: number;
  };
  precipitation: {
    probability: number;
    amount: number;
  };
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  siqsResult: ExtendedSiqsResult | null;
  reliability: number;
}

export interface BatchLocationData {
  latitude: number;
  longitude: number;
  bortleScale?: number;
  name?: string;
  priority?: number;
  forecastDay?: number;  // Explicitly define the forecastDay property
  cloudCover?: number;
  isValidated?: boolean; // Track if location has been validated
  isWater?: boolean;     // Track if location is a water location
}

export interface BatchForecastResult {
  location: {
    latitude: number;
    longitude: number;
    bortleScale?: number;
    name?: string;
  };
  forecast: ForecastDayAstroData[] | ForecastDayAstroData | null;
  success: boolean;
}

export interface ExtendedSiqsResult {
  siqs: number;
  isViable: boolean;
  bortleScale: number;
  cloudCover: number;
  timestamp: number;
  confidence?: number;
  [key: string]: any;
}


/**
 * Options for SIQS calculation service
 */
export interface SiqsCalculationOptions {
  /** Use single hour as reference point (instead of average) */
  useSingleHourSampling?: boolean;
  
  /** Target hour (0-23) for single hour sampling */
  targetHour?: number;
  
  /** How long to cache results (in minutes) */
  cacheDurationMins?: number;
  
  /** Enable forecast mode for future predictions */
  useForecasting?: boolean;
  
  /** Day index for forecast (0-15) */
  forecastDay?: number;
  
  /** Forecast data if already available */
  forecastData?: any;
}

/**
 * Response from the SIQS calculation service
 */
export interface SiqsCalculationResponse {
  /** The SIQS score */
  siqs: number;
  
  /** Whether conditions are viable */
  isViable: boolean;
  
  /** Full SIQS result */
  siqsResult: any;
  
  /** Whether result was from cache */
  fromCache: boolean;
  
  /** Timestamp of calculation */
  timestamp: string;
}

/**
 * Weather data with clear sky information
 */
export interface WeatherDataWithClearSky {
  /** Cloud cover percentage (0-100) */
  cloudCover: number;
  
  /** Temperature in celsius */
  temperature?: number;
  
  /** Humidity percentage (0-100) */
  humidity?: number;
  
  /** Wind speed in km/h */
  windSpeed?: number;
  
  /** Precipitation amount in mm */
  precipitation?: number;
  
  /** Weather condition descriptor */
  weatherCondition?: string;
  
  /** Annual clear sky rate percentage */
  clearSkyRate?: number;
  
  /** Air Quality Index */
  aqi?: number;
  
  /** Latitude of data point */
  latitude: number;
  
  /** Longitude of data point */
  longitude: number;
  
  /** Nighttime cloud data */
  nighttimeCloudData?: {
    /** Average cloud cover percentage during night */
    average: number | null;
    
    /** Evening cloud cover percentage */
    evening?: number | null;
    
    /** Morning cloud cover percentage */
    morning?: number | null;
    
    /** Time range for data */
    timeRange: string;
    
    /** Source of data (forecast, calculated, historical, optimized) */
    sourceType?: 'forecast' | 'calculated' | 'historical' | 'optimized';
  };
  
  /** Forecast data for calculations */
  _forecast?: any;
}

/**
 * Result of SIQS calculation
 */
export interface SiqsResult {
  /** SIQS score (0-10, higher is better) */
  siqs: number;
  
  /** Whether conditions are viable for astrophotography */
  isViable: boolean;
  
  /** Individual factor results */
  factors?: {
    /** Factor name */
    name: string;
    
    /** Factor score (0-10 scale) */
    score: number;
    
    /** Description of the factor */
    description: string;
    
    /** Nighttime data if available */
    nighttimeData?: any;
  }[];
  
  /** Weather data used for calculation */
  weatherData?: WeatherDataWithClearSky;
  
  /** Forecast data used for calculation */
  forecastData?: any;
  
  /** Additional metadata */
  metadata?: {
    /** When calculation was performed */
    calculatedAt: string;
    
    /** Data sources used */
    sources?: {
      /** Whether weather data was used */
      weather: boolean;
      
      /** Whether forecast data was used */
      forecast: boolean;
      
      /** Whether clear sky data was used */
      clearSky: boolean;
      
      /** Whether light pollution data was used */
      lightPollution: boolean;
      
      /** Whether terrain correction was applied */
      terrainCorrected: boolean;
      
      /** Whether climate data was used */
      climate: boolean;
      
      /** Whether single hour sampling was used */
      singleHourSampling: boolean;
    };
  };
}

/**
 * Moon phase information
 */
export interface MoonPhaseInfo {
  /** Moon phase (0-1, 0=new moon, 0.5=full moon) */
  phase: number;
  
  /** Moon phase name */
  name: string;
  
  /** Illumination percentage */
  illumination: number;
  
  /** Whether conditions are good for astronomy */
  isGoodForAstronomy: boolean;
}

/**
 * Moonless night information for astronomical viewing
 */
export interface MoonlessNightInfo {
  /** Duration in hours */
  duration: number;
  
  /** Start time (string format) */
  startTime: string;
  
  /** End time (string format) */
  endTime: string;
  
  /** Moonrise time */
  moonrise: Date | string;
  
  /** Moonset time */
  moonset: Date | string;
  
  /** Date of next new moon */
  nextNewMoon: string;
  
  /** Days until next new moon */
  daysUntilNewMoon: number;
  
  /** Start of astronomical night */
  astronomicalNightStart: string;
  
  /** End of astronomical night */
  astronomicalNightEnd: string;
  
  /** Duration of astronomical night in hours */
  astronomicalNightDuration: number;
}

/**
 * Batch SIQS calculation result interface for multiple locations
 */
export interface BatchSiqsResult {
  /** Location processed */
  location: {
    latitude: number;
    longitude: number;
    name?: string;
    bortleScale?: number;
    forecastDay?: number;
  };
  
  /** SIQS calculation result */
  siqsResult: SiqsResult;
  
  /** Calculation timestamp */
  timestamp: number;
  
  /** Calculation confidence (0-10) */
  confidence?: number;
}

/**
 * Options for batch SIQS calculations
 */
export interface BatchSiqsOptions extends SiqsCalculationOptions {
  /** Maximum concurrent calculations */
  concurrencyLimit?: number;
  
  /** Prioritize accuracy over speed */
  prioritizeAccuracy?: boolean;
  
  /** Max runtime in ms before returning partial results */
  timeout?: number;
}

/**
 * Interface for batch location data with additional forecast properties
 */
export interface BatchLocationData {
  /** Location latitude */
  latitude: number;
  
  /** Location longitude */
  longitude: number;
  
  /** Optional location name */
  name?: string;
  
  /** Optional bortle scale value */
  bortleScale?: number;
  
  /** Forecast day index (0-15) */
  forecastDay: number;
  
  /** Processing priority (higher value = higher priority) */
  priority: number;
}

// For compatibility with existing code
export type { SiqsResult as SIQSResult };

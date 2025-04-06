
/**
 * Type definitions for the SIQS (Stellar Imaging Quality Score) system
 */

/**
 * A single factor contributing to the SIQS calculation
 */
export interface SIQSFactor {
  /** Name of the factor */
  name: string;
  
  /** Raw score for this factor (0-10 scale) */
  score: number;
  
  /** Weight of this factor in the overall calculation */
  weight?: number;
  
  /** Normalized score after applying weights */
  normalizedScore?: number;
  
  /** Description of the factor's impact */
  description?: string;
  
  /** Original raw value (e.g., percentage, scale value) */
  rawValue?: number | string;
  
  /** Nighttime data for cloud cover and other elements */
  nighttimeData?: {
    /** Average value over night hours */
    average: number;
    /** Time range for the data */
    timeRange: string;
    /** Optional detailed breakdown */
    detail?: {
      evening: number;
      morning: number;
    };
  };
}

/**
 * Result of SIQS calculation
 */
export interface SIQSResult {
  /** Overall SIQS score (0-10 scale) */
  score: number;
  
  /** Array of individual factors contributing to the score */
  factors: SIQSFactor[];
  
  /** Timestamp when the calculation was performed */
  timestamp?: string;
  
  /** Optional location information */
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  
  /** Whether conditions are viable for astronomical imaging */
  isViable?: boolean;
}

/**
 * Input parameters for SIQS calculation
 */
export interface SIQSInputParams {
  /** Cloud cover percentage (0-100) */
  cloudCover: number;
  
  /** Bortle scale value (1-9) */
  bortleScale: number;
  
  /** Seeing conditions (1-5 scale) */
  seeingConditions: number;
  
  /** Wind speed (km/h) */
  windSpeed: number;
  
  /** Humidity percentage (0-100) */
  humidity: number;
  
  /** Moon phase (0-1, where 0=new moon, 1=full moon) */
  moonPhase: number;
  
  /** Air Quality Index */
  aqi?: number;
  
  /** Weather condition description */
  weatherCondition?: string;
  
  /** Precipitation amount (mm) */
  precipitation?: number;
  
  /** Clear sky rate percentage (0-100) */
  clearSkyRate?: number;
  
  /** Elevation in meters */
  elevation?: number;
  
  /** Array of nighttime forecast data */
  nightForecast?: any[];
}

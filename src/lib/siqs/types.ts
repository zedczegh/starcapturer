
/**
 * Type definitions for the SIQS (Stellar Imaging Quality Score) system
 */

/**
 * Input factors for SIQS calculation
 */
export interface SIQSFactors {
  /**
   * Cloud cover percentage (0-100)
   */
  cloudCover: number;
  
  /**
   * Bortle scale value (1-9)
   */
  bortleScale: number;
  
  /**
   * Seeing conditions (1-5, lower is better)
   */
  seeingConditions: number;
  
  /**
   * Wind speed in km/h
   */
  windSpeed: number;
  
  /**
   * Humidity percentage (0-100)
   */
  humidity: number;
  
  /**
   * Moon phase (0-1, 0 = new moon, 1 = full moon)
   */
  moonPhase?: number;
  
  /**
   * Precipitation amount in mm
   */
  precipitation?: number;
  
  /**
   * Weather condition description
   */
  weatherCondition?: string;
  
  /**
   * Air Quality Index
   */
  aqi?: number;
  
  /**
   * Clear sky rate percentage
   */
  clearSkyRate?: number;
  
  /**
   * Hourly forecast data for more detailed analysis
   */
  nightForecast?: any[];
}

/**
 * Individual SIQS factor with score and description
 */
export interface SIQSFactor {
  /**
   * Factor name
   */
  name: string;
  
  /**
   * Factor score (0-10)
   */
  score: number;
  
  /**
   * Human-readable description of the factor
   */
  description: string;
  
  /**
   * Optional nighttime data for factors like cloud cover
   */
  nighttimeData?: {
    /**
     * Average value during nighttime hours
     */
    average: number;
    
    /**
     * Time range for nighttime data
     */
    timeRange: string;
    
    /**
     * Optional detailed breakdown
     */
    detail?: {
      evening: number;
      morning: number;
    };
  };
}

/**
 * Result of the SIQS calculation
 */
export interface SIQSResult {
  /**
   * Overall SIQS score (0-10)
   */
  score: number;
  
  /**
   * Whether the conditions are viable for astronomy
   */
  isViable: boolean;
  
  /**
   * Individual factors that make up the score
   */
  factors: SIQSFactor[];
}

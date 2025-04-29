
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

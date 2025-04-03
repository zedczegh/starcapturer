
/**
 * SIQS (Stellar Imaging Quality Score) types and interfaces
 */

/**
 * Factors used in SIQS calculation
 */
export interface SIQSFactors {
  cloudCover: number;   // Cloud cover percentage (0-100)
  bortleScale: number;  // Bortle Dark-Sky Scale (1-9, lower is better)
  seeingConditions: number; // Seeing conditions (1-5, lower is better)
  windSpeed: number;    // Wind speed in km/h
  humidity: number;     // Humidity percentage (0-100)
  moonPhase?: number;   // Moon phase (0-1, 0=new moon, 0.5=full moon, 1=new moon)
  precipitation?: number; // Precipitation amount in mm
  weatherCondition?: string; // Weather condition descriptor
  aqi?: number;         // Air Quality Index (lower is better)
  clearSkyRate?: number; // Annual clear sky rate percentage (higher is better)
  nightForecast?: any[]; // Forecast data for nighttime
}

/**
 * Result of SIQS calculation
 */
export interface SIQSResult {
  score: number;        // SIQS score (0-10, higher is better)
  isViable: boolean;    // Whether conditions are viable for astrophotography
  factors: {            // Individual factor results
    name: string;       // Factor name
    score: number;      // Factor score (0-10 scale)
    description: string; // Description of the factor
    nighttimeData?: {
      average: number;   // Nighttime average value
      timeRange: string; // Time range for nighttime average
    };
  }[];
}


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
  isNighttimeCalculation?: boolean; // Flag indicating this is a nighttime calculation
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
      detail?: {
        evening: number;
        morning: number;
      };
    };
  }[];
  metadata?: {          // Metadata about the calculation
    calculationType: string;  // Type of calculation (e.g., 'nighttime')
    timestamp: string;        // When the calculation was performed
    eveningCloudCover?: number;
    morningCloudCover?: number;
    avgNightCloudCover?: number;
  };
}

/**
 * Location with SIQS data
 */
export interface LocationWithSIQS {
  id?: string;          // Unique identifier
  name: string;         // Location name
  latitude: number;     // Latitude
  longitude: number;    // Longitude
  bortleScale?: number; // Light pollution level
  weatherData?: any;    // Weather data
  siqsResult?: SIQSResult; // SIQS calculation result
  clearSkyRate?: number;   // Annual clear sky rate
  timestamp?: string;      // When the data was collected
}

/**
 * Specific parameters for nighttime SIQS calculation
 */
export interface NighttimeSIQSParams {
  startHour?: number;    // Start hour for nighttime (default: 18, 6 PM)
  endHour?: number;      // End hour for nighttime (default: 8, 8 AM next day)
  cloudWeight?: number;  // Weight for cloud cover in calculation (default: 0.3)
  windWeight?: number;   // Weight for wind in calculation (default: 0.15)
  humidityWeight?: number; // Weight for humidity in calculation (default: 0.15)
  bortleWeight?: number;   // Weight for light pollution in calculation (default: 0.3)
  clearSkyWeight?: number; // Weight for clear sky rate (default: 0.1)
}

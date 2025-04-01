
/**
 * Type definitions for SIQS (Stellar Imaging Quality Score)
 */

// Input factors for SIQS calculation
export interface SIQSFactors {
  cloudCover: number;
  bortleScale: number;
  seeingConditions: number;
  windSpeed: number;
  humidity: number;
  moonPhase?: number;
  precipitation?: number;
  weatherCondition?: string | number;
  aqi?: number;
  nightForecast?: any[];
}

// Individual factor with name, score, and description
export interface SIQSFactor {
  name: string;
  score: number;
  description: string;
}

// SIQS calculation result
export interface SIQSResult {
  score: number;
  isViable: boolean;
  factors: SIQSFactor[];
}

// Weather forecast item (for consistency)
export interface ForecastItem {
  time: string;
  cloudCover: number;
  windSpeed: number;
  humidity: number;
  precipitation?: number;
  weatherCode?: number;
}

// Night forecast specifics
export interface NightForecast {
  items: ForecastItem[];
  avgCloudCover: number;
  avgWindSpeed: number;
  avgHumidity: number;
  hasPrecipitation: boolean;
}

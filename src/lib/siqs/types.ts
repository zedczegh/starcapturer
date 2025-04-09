
/**
 * Type definitions for SIQS calculation
 */

export interface SIQSFactors {
  cloudCover: number;
  bortleScale: number;
  seeingConditions: number;
  windSpeed?: number;
  humidity?: number;
  moonPhase?: number;
  nightForecast?: any[];
  precipitation?: number;
  weatherCondition?: string;
  aqi?: number;
  clearSkyRate?: number;
  isNighttimeCalculation?: boolean;
}

export interface SIQSFactor {
  name: string;
  score: number;
  description: string;
  nighttimeData?: {
    average: number;
    timeRange: string;
    detail?: {
      evening: number;
      morning: number;
    };
  };
}

export interface SIQSMetadata {
  calculationType?: string;
  timestamp: string;
  eveningCloudCover?: number;
  morningCloudCover?: number;
  avgNightCloudCover?: number;
}

export interface SIQSResult {
  score: number;
  isViable: boolean;
  factors: SIQSFactor[];
  metadata?: SIQSMetadata;
  isNighttimeCalculation?: boolean;
}

export interface SIQSDisplayData {
  displayScore: string;
  colorClass: string;
  isViable: boolean;
  isNighttimeCalculation: boolean;
}

/**
 * Interface for astronomy location data
 */
export interface SharedAstroSpot {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  seeingConditions?: number;
  isDarkSkyReserve?: boolean;
  certification?: string;
  description?: string;
  distance?: number;
  weatherData?: any;
  siqs?: number;
  siqsResult?: SIQSResult;
  siqsFactors?: any[];
  isViable?: boolean;
  timestamp?: string;
  created?: string;
  updated?: string;
  moonPhase?: number;
}

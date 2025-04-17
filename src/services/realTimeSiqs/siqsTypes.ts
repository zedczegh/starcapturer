
/**
 * Types for SIQS calculation
 */

// Weather data enhanced with clear sky information
export interface WeatherDataWithClearSky {
  temperature: number;
  humidity: number;
  cloudCover: number;
  visibility: number;
  windSpeed: number;
  moonPhase: number;
  clearSkyRate: number;
  rain?: number;
  snow?: number;
}

// SIQS calculation result
export interface SiqsResult {
  score: number;
  isViable: boolean;
  factors?: Array<{
    name: string;
    score: number;
    description: string;
  }>;
}

// SIQS location result
export interface SiqsLocationResult {
  siqs: number;
  isViable: boolean;
  id: string;
  name: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
  distance?: number;
  description?: string;
  certification?: string;
  isDarkSkyReserve?: boolean;
  timestamp: string;
  type?: string;
  siqsResult?: {
    score: number;
    isViable: boolean;
    factors?: Array<{
      name: string;
      score: number;
      description: string;
    }>;
  };
}


// Define types for SIQS calculation
export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  factors?: {
    name: string;
    score: number;
    description: string;
  }[];
  metadata?: {
    calculatedAt: string;
    sources: {
      weather: boolean;
      forecast: boolean;
      clearSky: boolean;
      lightPollution: boolean;
    };
    reliability?: {
      score: number;
      issues: string[];
    };
  };
}

export interface WeatherDataWithClearSky {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation: number;
  clearSkyRate?: number;
  latitude: number;
  longitude: number;
  time?: string;
  condition?: string;
  aqi?: number;
  _forecast?: any;
}

export interface MoonlessNightInfo {
  duration: number; // in hours
  startTime: string;
  endTime: string;
  moonrise: string;
  moonset: string;
  nextNewMoon: string;
  daysUntilNewMoon: number;
}

export interface MoonPhaseInfo {
  phase: number; // 0-1 normalized value
  name: string;
  illumination: number; // percentage 0-100
  isGoodForAstronomy: boolean;
}

// Add missing SiqsCalculationOptions interface
export interface SiqsCalculationOptions {
  anomalyDetection?: boolean;
  includeMetadata?: boolean;
  includeForecast?: boolean;
}

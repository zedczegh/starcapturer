
// Define types for SIQS calculation
export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  weatherData?: WeatherDataWithClearSky;
  forecastData?: any;
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
      terrainCorrected?: boolean;
      climate?: boolean;
      singleHourSampling?: boolean;
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
  nighttimeCloudData?: {
    average: number;
    timeRange: string;
    sourceType: 'forecast' | 'calculated' | 'historical' | 'optimized';
  };
}

export interface MoonlessNightInfo {
  duration: number; // in hours
  startTime: string;
  endTime: string;
  moonrise: Date | string;
  moonset: Date | string;
  nextNewMoon: string;
  daysUntilNewMoon: number;
  astronomicalNightStart: string;
  astronomicalNightEnd: string;
  astronomicalNightDuration: number;
}

export interface MoonPhaseInfo {
  phase: number; // 0-1 normalized value
  name: string;
  illumination: number; // percentage 0-100
  isGoodForAstronomy: boolean;
}

// Add SiqsCalculationOptions interface
export interface SiqsCalculationOptions {
  anomalyDetection?: boolean;
  includeMetadata?: boolean;
  includeForecast?: boolean;
  reliability?: boolean;
  adjustForLatitude?: boolean;
  useSingleHourSampling?: boolean;
  targetHour?: number;
}

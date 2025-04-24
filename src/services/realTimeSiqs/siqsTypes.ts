
// SIQS Calculation Types

export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  factors?: any[];
  weatherData?: WeatherDataWithClearSky;
  forecastData?: any;
  metadata?: {
    calculatedAt: string;
    targetHour?: number;
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

export interface WeatherData {
  temperature: number;
  humidity: number;
  cloudCover: number;
  precipitation: number;
  windSpeed: number;
  aqi?: number;
  weatherCondition?: string;
  timestamp?: string;
}

export interface WeatherDataWithClearSky extends WeatherData {
  clearSkyRate?: number;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  nighttimeCloudData?: {
    average: number;
    timeRange?: string;
    sourceType?: 'forecast' | 'calculated' | 'historical' | 'optimized';
  };
  _forecast?: any;
}

export interface SiqsCalculationOptions {
  useSingleHourSampling?: boolean;
  targetHour?: number;
  cacheDurationMins?: number;
  includeMetadata?: boolean;
  forecastDays?: number;
  hourlyWeighting?: boolean;
  useHistoricalData?: boolean;
  useRealTimeData?: boolean;
  anomalyDetection?: boolean;
  includeForecast?: boolean;
  reliability?: boolean;
  adjustForLatitude?: boolean;
}

export interface SiqsComparisonResult {
  score: number;
  comparison: 'better' | 'worse' | 'similar';
  percentDifference: number;
  factors?: {
    improved: string[];
    worsened: string[];
  };
}

export interface MoonPhaseInfo {
  phase: number; // 0-1 normalized value
  name: string;
  illumination: number; // percentage 0-100
  isGoodForAstronomy: boolean;
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

// Display options for SIQS UI components
export interface SiqsDisplayOptions {
  skipCache?: boolean;
  useSingleHourSampling?: boolean;
  targetHour?: number;
}

// Add this if the file doesn't exist or update it if it does

export interface WeatherDataWithClearSky {
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  cloudCover: number;
  precipitation?: number;
  aqi?: number;
  clearSkyRate?: number;
  latitude: number;
  longitude: number;
  _forecast?: any;
  nighttimeCloudData?: {
    average: number;
    timeRange: string;
    sourceType?: string;
  };
  timestamp?: string;  // Replaces 'time' for tracking when data was collected
  quality?: string;    // Replaces 'sourceQuality' for tracking data source quality
}

export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  weatherData?: WeatherDataWithClearSky;
  forecastData?: any;
  factors?: Array<{
    name: string;
    score: number;
    description: string;
  }>;
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

export interface SiqsCalculationOptions {
  useSingleHourSampling?: boolean;
  targetHour?: number;
  cacheDurationMins?: number;
  skipApiCalls?: boolean;
  maxConcurrent?: number;
  anomalyDetection?: boolean;
  includeMetadata?: boolean;
}

// Add the SiqsDisplayOptions interface that's needed by RealTimeSiqsProvider
export interface SiqsDisplayOptions {
  latitude: number;
  longitude: number;
  bortleScale?: number;
  isCertified?: boolean;
  isDarkSkyReserve?: boolean;
  existingSiqs?: number | any;
  skipCache?: boolean;
  useSingleHourSampling?: boolean;
  targetHour?: number;
}

// Add MoonPhaseInfo interface needed by moonPhaseCalculator
export interface MoonPhaseInfo {
  phase: number;
  name: string;
  illumination: number;
  isGoodForAstronomy: boolean;
}

// Add MoonlessNightInfo interface needed by moonUtils
export interface MoonlessNightInfo {
  duration: number;
  startTime: string;
  endTime: string;
  moonrise: string;
  moonset: string;
  nextNewMoon: string;
  daysUntilNewMoon: number;
  astronomicalNightStart: string;
  astronomicalNightEnd: string;
  astronomicalNightDuration: number;
}

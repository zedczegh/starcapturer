
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
    average: number | null;
    evening?: number | null;
    morning?: number | null;
    sourceType?: 'forecast' | 'calculated';
  };
  _forecast?: any; // Added to handle forecast data references
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
  anomalyDetection?: boolean; // Added missing option
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

// Add missing interfaces referenced by other files
export interface MoonPhaseInfo {
  phase: number;
  name: string;
  illumination: number;
  isNew?: boolean;
  isFull?: boolean;
  isGoodForAstronomy?: boolean; // Added missing property
}

export interface MoonlessNightInfo {
  isGoodForAstro: boolean;
  moonPhase: number;
  moonrise: string;
  moonset: string;
  moonriseTime?: string;
  moonsetTime?: string;
  sunriseTime?: string;
  sunsetTime?: string;
  hoursBetweenSunsetAndMoonrise?: number;
  hoursBetweenMoonsetAndSunrise?: number;
  hasMoonlessWindow?: boolean;
  moonlessWindowDuration?: number;
  duration: number; // Added missing property
  startTime: string; // Added missing property
  endTime: string; // Added missing property
  daysUntilNewMoon: number; // Added missing property
  nextNewMoon?: string;
  astronomicalNightStart?: string;
  astronomicalNightEnd?: string;
  astronomicalNightDuration?: number;
}

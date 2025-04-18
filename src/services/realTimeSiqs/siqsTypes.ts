
export interface SiqsResult {
  score: number;
  isViable: boolean;
  siqsResult?: {
    score: number;
    isViable: boolean;
    factors?: Array<{
      name: string;
      score: number;
      description: string;
    }>;
  };
  // Adding back essential properties used by other components
  siqs?: number; // For compatibility with existing code
  factors?: Array<{
    name: string;
    score: number;
    description: string;
  }>;
  metadata?: {
    calculatedAt?: string;
    sources?: {
      weather: boolean;
      forecast: boolean;
      clearSky: boolean;
      lightPollution: boolean;
    };
    reliability?: {
      confidenceScore: number;
      issues: string[];
    };
  };
}

// Adding back needed types for other components
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
  precipitation?: number;
  time?: string;
  latitude?: number;
  longitude?: number;
  _forecast?: any;
  weatherCondition?: string;
}

export interface MoonPhaseInfo {
  phase: number;
  illumination: number;
  name: string;
  isNewMoon: boolean;
  isFullMoon: boolean;
}

export interface MoonlessNightInfo {
  duration: number;
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

export interface SiqsCalculationOptions {
  anomalyDetection?: boolean;
  includeMetadata?: boolean;
  cacheDuration?: number;
}

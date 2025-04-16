
// SIQSResult type definition
export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  factors?: Array<{
    name: string;
    score: number;
    description?: string;
  }>;
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

// Type for WeatherData with clear sky rate
export interface WeatherDataWithClearSky {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation: number;
  time: string;
  condition?: string;
  clearSkyRate?: number;
  latitude: number;
  longitude: number;
  _forecast?: any;
  aqi?: number;
}

// Type for the Moonless Night Info
export interface MoonlessNightInfo {
  duration: number;
  startTime: string;
  endTime: string;
  moonrise: string;
  moonset: string;
  nextNewMoon: string;
  daysUntilNewMoon: number;
}

// Type for the Moon Phase Info
export interface MoonPhaseInfo {
  phase: number;
  illumination: number;
  name: string;
  isGoodForAstronomy: boolean;
}

// Add SiqsFactor back since it's used in other files
export interface SiqsFactor {
  name: string;
  score: number;
  description?: string;
  nighttimeData?: any;
}

// Add SiqsCalculationOptions for API options
export interface SiqsCalculationOptions {
  anomalyDetection?: boolean;
  includeMetadata?: boolean;
  includeForecast?: boolean;
}

// Type for enhanced location data
export interface EnhancedLocationData {
  name: string;
  latitude: number;
  longitude: number;
  clearSkyRate: number;
  bortleScale?: number;
  averageVisibility?: 'excellent' | 'good' | 'average' | 'poor';
  isDarkSkyReserve?: boolean;
  certification?: string;
}

// Type for climate region data
export interface ClimateRegion {
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  adjustmentFactors: {
    [month: number]: number;
  };
}


// Define types for SIQS calculation
export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  factors?: {
    name: string;
    score: number;
    description?: string;
  }[];
  metadata?: {
    calculatedAt: string;
    sources?: {
      weather: boolean;
      forecast: boolean;
      clearSky: boolean;
      lightPollution: boolean;
    };
  };
}

// Define enhanced location data structure
export interface EnhancedLocation {
  name: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
  clearSkyRate: number;
  isDarkSkyReserve?: boolean;
  certification?: string;
  averageVisibility: 'excellent' | 'good' | 'fair' | 'poor';
}

// Define weather data with clear sky information
export interface WeatherDataWithClearSky {
  clearSkyRate?: number;
  latitude: number;
  longitude: number;
  cloudCover?: number;
  humidity?: number;
  windSpeed?: number;
  precipitation?: number;
  temperature?: number;
  aqi?: number;
  _forecast?: any;
  [key: string]: any;
}

// Define moon phase information
export interface MoonPhaseInfo {
  phase: number; // 0-1 where 0 is new moon, 0.5 is full moon, 1 is new moon again
  illumination: number; // 0-1 percentage of moon illuminated
  name: string; // Name of the moon phase (e.g., "New Moon", "Full Moon")
}

// Define climate region
export interface ClimateRegion {
  name: string;
  borders: [number, number][]; // Array of [latitude, longitude] points defining the region
  adjustmentFactors: number[]; // 12 monthly adjustment factors (January = 0, December = 11)
}

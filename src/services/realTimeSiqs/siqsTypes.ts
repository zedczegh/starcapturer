
/**
 * Type definitions for the SIQS calculation system
 */

// Weather data with clear sky information
export interface WeatherDataWithClearSky {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed?: number;
  precipitation?: number;
  aqi?: number; // Air Quality Index
  clearSky: number; // Percentage of clear sky (100 - cloudCover)
  latitude?: number;  // Optional location data 
  longitude?: number; // Optional location data
}

// Basic weather data without clear sky
export interface WeatherData {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed?: number;
  precipitation?: number;
  aqi?: number;
  time?: string;
  condition?: string;
}

// SIQS calculation options
export interface SiqsCalculationOptions {
  includeFactors?: boolean;
  includeMetadata?: boolean;
  anomalyDetection?: boolean;
  useHistoricalData?: boolean;
}

// SIQS factor with score and description
export interface SiqsFactor {
  name: string;
  score: number;
  description: string;
  value?: number | string;
  nighttimeData?: any;
}

// SIQS calculation result
export interface SiqsResult {
  siqs: number;
  score: number;
  isViable: boolean;
  factors?: SiqsFactor[];
  metadata?: {
    timestamp: string;
    bortleScale: number;
    weatherSnapshot: any;
  };
}

// Climate region definition
export interface ClimateRegion {
  name: string;
  description: string;
  boundaries: {
    latMin: number;
    latMax: number;
    longMin: number;
    longMax: number;
  };
  adjustmentFactors: number[];
}

// Moonless night information
export interface MoonlessNightInfo {
  moonrise: Date;
  moonset: Date;
  startTime: Date;
  endTime: Date;
  duration: number;
  daysUntilNewMoon: number;
  isTonight: boolean;
}

// Enhanced location with computed data - updated with all necessary fields
export interface EnhancedLocation {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  siqsScore?: number;
  bortleScale: number;
  weatherData?: WeatherData;
  certification?: string;
  isDarkSkyReserve?: boolean;
  distance?: number;
  timestamp?: string;
  elevation?: number; // Added property
  hasDarkSkyStatus?: boolean; // Added property
  clearSkyRate?: number; // Added property
  seasonalTrends?: { // Added property
    spring: { clearSkyRate: number, averageTemperature: number },
    summer: { clearSkyRate: number, averageTemperature: number },
    fall: { clearSkyRate: number, averageTemperature: number },
    winter: { clearSkyRate: number, averageTemperature: number }
  };
  bestMonths?: string[]; // Added property
}

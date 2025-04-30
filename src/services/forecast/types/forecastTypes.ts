
// Define forecast data structure
export interface ForecastDayAstroData {
  date: string;
  dayIndex: number;
  cloudCover: number;
  siqs: number;
  moonPhase: number;
  moonIllumination: number;
  temperature: number | { min: number; max: number; };
  humidity: number;
  windSpeed: number;
  isViable: boolean;
  qualityDescription: string;
  predictedSeeing: number;
  precipitation?: {
    probability: number;
    amount: number | null;
  };
  weatherCode?: number;
  reliability?: number;
  siqsResult?: any;
}

// Define forecast map point type
export interface ForecastMapPoint {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  siqs: number;
  cloudCover: number;
  forecastDay: number;
  forecastDate: string;
  isViable: boolean;
}

// Define batch location data interface
export interface BatchLocationData {
  latitude: number; 
  longitude: number;
  name?: string;
  bortleScale?: number;
  forecastDay?: number;
}

// Define batch forecast request type
export interface BatchForecastRequest {
  locations: Array<{
    latitude: number;
    longitude: number;
    name?: string;
    bortleScale?: number;
  }>;
  forecastDay: number;
}

// Define batch result interface
export interface BatchForecastResult {
  location: BatchLocationData;
  success: boolean;
  forecast?: ForecastDayAstroData;
  error?: string;
}

// Define extended SIQS result
export interface ExtendedSiqsResult {
  siqs: number;
  isViable: boolean;
  bortleScale: number;
  cloudCover: number;
  timestamp: number;
}

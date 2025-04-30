
// Define forecast data structure
export interface ForecastDayAstroData {
  date: string;
  dayIndex: number;
  cloudCover: number;
  siqs: number;
  moonPhase: number;
  moonIllumination: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  isViable: boolean;
  qualityDescription: string;
  predictedSeeing: number;
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


export interface WeatherDataWithClearSky {
  temperature: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  precipitation: number;
  time: string;
  condition?: string;
  weatherCondition?: string | number;
  aqi?: number;
  clearSkyRate?: number;
  
  // Added for geolocation context
  latitude?: number;
  longitude?: number;
  
  // Added for forecast data access
  _forecast?: {
    hourly?: {
      time?: string[];
      temperature_2m?: number[];
      cloud_cover?: number[];
      relative_humidity_2m?: number[];
    }
  }
}

export interface SiqsFactor {
  name: string;
  score: number;
  description?: string;
  nighttimeData?: any;
}

export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  factors?: SiqsFactor[];
  metadata?: {
    calculatedAt: string;
    sources: {
      weather: boolean;
      forecast: boolean;
      clearSky: boolean;
      lightPollution: boolean;
    }
  }
}

// Add new interface for moonless night calculations
export interface MoonlessNightInfo {
  duration: number;  // Duration in hours
  startTime: string;
  endTime: string;
  nextNewMoon: string;
  daysUntilNewMoon: number;
}

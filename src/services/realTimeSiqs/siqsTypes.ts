
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
  time?: string;
  condition?: string;
  weatherCondition?: string;
  nighttimeCloudData?: {
    average: number;
    timeRange?: string;
    sourceType?: string;
    evening?: number | null;
    morning?: number | null;
  };
  timestamp?: string;  // Replaces 'time' for tracking when data was collected
  quality?: string;    // Replaces 'sourceQuality' for tracking data source quality
}

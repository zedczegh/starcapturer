
// Extended WeatherData interface with clearSkyRate
export interface WeatherDataWithClearSky extends Record<string, any> {
  cloudCover: number;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  precipitation?: number;
  weatherCondition?: string;
  aqi?: number;
  clearSkyRate?: number;
}

export interface SiqsResult {
  siqs: number;
  isViable: boolean;
  factors?: any[];
}


/**
 * Interface for shared astronomy spot data
 */
export interface SharedAstroSpot {
  id?: string;
  name?: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  description?: string | null;
  timestamp?: string;
  certification?: string | null;
  isDarkSkyReserve?: boolean;
  bortleScale?: number;
  siqs?: number | { score: number; isViable: boolean };
  distance?: number;
  isViable?: boolean;
  preferenceScore?: number;
  // Forecast-specific fields
  isForecast?: boolean;
  forecastDate?: string;
  weatherData?: {
    cloudCover?: number;
    temperature?: number;
    windSpeed?: number;
    humidity?: number;
    precipitation?: number;
    weatherCode?: number;
  };
}

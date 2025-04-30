
// Add the forecast properties to the SharedAstroSpot interface
export interface SharedAstroSpot {
  id?: string;
  name: string;
  chineseName?: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  certification?: string;
  isDarkSkyReserve?: boolean;
  timestamp?: string;
  siqsTimestamp?: string;
  siqs?: number | { score: number; isViable: boolean };
  isViable?: boolean;
  distance?: number;
  imageUrl?: string;
  createdBy?: string;
  userDisplayName?: string;
  
  // Forecast-specific properties
  isForecast?: boolean;
  forecastDay?: number;
  forecastDate?: string;
  cloudCover?: number;
}

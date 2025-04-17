
// Main API file that re-exports all functionality from the sub-modules
export type { Coordinates } from './api/coordinates';
export { validateCoordinates, normalizeLongitude, calculateDistance } from './api/coordinates';

export type { WeatherData, WeatherResponse } from './api/weather';
export { 
  fetchWeatherData,
  determineWeatherCondition, 
  weatherConditions 
} from './api/weather';

export { 
  fetchForecastData,
  fetchLongRangeForecastData 
} from './api/forecast';

export { getLocationNameFromCoordinates } from './api/location';
export { fetchLightPollutionData } from './api/pollution';

// Export clear sky rate functionality
export { fetchClearSkyRate, clearClearSkyRateCache } from './api/clearSkyRate';

// Export types and functions related to shared astronomy spots
export type { SharedAstroSpot } from './api/astroSpots';
export { 
  getRecommendedPhotoPoints,
  getSharedAstroSpot,
  shareAstroSpot
} from './api/astroSpots';

// Add SharingResponse type
export interface SharingResponse {
  success: boolean;
  message?: string;
  data?: any;
}


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

export { fetchLightPollutionData } from './api/pollution';

// Export clear sky rate functionality
export { fetchClearSkyRate, clearClearSkyRateCache } from './api/clearSkyRate';

// Export types and functions related to shared astronomy spots
export type { SharedAstroSpot, SharingResponse } from './api/astroSpots';
export { 
  getRecommendedPhotoPoints,
  getSharedAstroSpot,
  shareAstroSpot,
  fetchDarkSkyLocations
} from './api/astroSpots';

// Re-export the location API functions
export { getLocationNameFromCoordinates } from './api/location';

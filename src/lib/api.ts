
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

// Export other functions related to shared astronomy spots
export * from './api/astroSpots';

// Function to get recommended photo points based on user location
export const getRecommendedPhotoPoints = async (latitude: number, longitude: number, radius = 100) => {
  // Re-use the existing getSharedAstroSpots function from astroSpots module
  const { getSharedAstroSpots } = await import('./api/astroSpots');
  return getSharedAstroSpots(latitude, longitude, 20, radius);
};

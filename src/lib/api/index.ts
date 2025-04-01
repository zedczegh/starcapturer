
/**
 * Central export file for all API functions
 */

// Location APIs
export { getLocationNameFromCoordinates } from './location';
export { fetchWeatherData } from './weather';
export { fetchLightPollutionData } from './pollution';
export { fetchForecastData, fetchLongRangeForecastData } from './forecast';
export { getRecommendedPhotoPoints, shareAstroSpot, getSharedAstroSpot } from './astroSpots';
export { fetchForecastDataForToday } from './daily-forecast';

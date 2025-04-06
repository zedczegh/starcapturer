
/**
 * API utilities for fetching location and environmental data
 */
import { fetchWeatherData } from './api/weather';
import { fetchLocationWeather } from './api/location';
import { fetchLightPollutionData } from './api/pollution';
import { fetchForecastData } from './api/forecast';
import { fetchClearSkyRate } from './api/clearSkyRate';
import { fetchPollutionForecast } from './api/pollutionForecast';
import { fetchCalculatedLocations } from './services/locationSearchService';
import { 
  getAstroSpot, 
  getAstroSpots, 
  getPhotographyLocations,
  getPhotoPoints
} from './api/astroSpots';

// Export all API functions
export {
  fetchWeatherData,
  fetchLocationWeather,
  fetchLightPollutionData,
  fetchForecastData,
  fetchClearSkyRate,
  fetchPollutionForecast,
  fetchCalculatedLocations,
  getAstroSpot,
  getAstroSpots,
  getPhotographyLocations,
  getPhotoPoints
};

/**
 * Unified location data fetcher
 */
export async function fetchLocationData(params: {
  latitude: number;
  longitude: number;
  includeWeather?: boolean;
  includePollution?: boolean;
  includeForecast?: boolean;
  forecastDays?: number;
}) {
  const { 
    latitude, 
    longitude, 
    includeWeather = true,
    includePollution = true,
    includeForecast = false,
    forecastDays = 3
  } = params;

  // Prepare promises for parallel fetching
  const promises = [];
  const results: Record<string, any> = { latitude, longitude };
  
  // Only fetch what's requested
  if (includeWeather) {
    promises.push(
      fetchWeatherData({ latitude, longitude })
        .then(data => { results.weather = data; })
        .catch(error => { 
          console.error('Weather data fetch failed:', error);
          results.weather = null;
        })
    );
  }
  
  if (includePollution) {
    promises.push(
      fetchLightPollutionData(latitude, longitude)
        .then(data => { results.pollution = data; })
        .catch(error => { 
          console.error('Pollution data fetch failed:', error);
          results.pollution = null;
        })
    );
  }
  
  if (includeForecast) {
    promises.push(
      fetchForecastData({ latitude, longitude, days: forecastDays })
        .then(data => { results.forecast = data; })
        .catch(error => { 
          console.error('Forecast data fetch failed:', error);
          results.forecast = null;
        })
    );
  }

  // Wait for all requests to complete
  await Promise.all(promises);
  
  return results;
}

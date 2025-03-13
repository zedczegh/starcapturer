
import { QueryClient } from '@tanstack/react-query';
import { fetchWeatherData, fetchLightPollutionData, fetchForecastData } from './api';

/**
 * Pre-fetches common location data to improve page transition speed
 * Called before navigation to have data ready when the page loads
 */
export const prefetchLocationData = async (
  queryClient: QueryClient, 
  latitude: number, 
  longitude: number
) => {
  // Generate cache keys
  const weatherKey = ['weather', latitude.toFixed(4), longitude.toFixed(4)];
  const lightPollutionKey = ['lightPollution', latitude.toFixed(4), longitude.toFixed(4)];
  const forecastKey = ['forecast', latitude.toFixed(4), longitude.toFixed(4)];
  
  // Prefetch weather data
  if (!queryClient.getQueryData(weatherKey)) {
    queryClient.prefetchQuery({
      queryKey: weatherKey,
      queryFn: () => fetchWeatherData({ latitude, longitude }),
      staleTime: 5 * 60 * 1000 // 5 minutes
    });
  }
  
  // Prefetch light pollution data
  if (!queryClient.getQueryData(lightPollutionKey)) {
    queryClient.prefetchQuery({
      queryKey: lightPollutionKey,
      queryFn: () => fetchLightPollutionData(latitude, longitude),
      staleTime: 60 * 60 * 1000 // 1 hour
    });
  }
  
  // Prefetch forecast data - lower priority so we'll use .fetchQuery instead of prefetchQuery
  setTimeout(() => {
    if (!queryClient.getQueryData(forecastKey)) {
      queryClient.fetchQuery({
        queryKey: forecastKey,
        queryFn: () => fetchForecastData({ latitude, longitude }),
        staleTime: 30 * 60 * 1000 // 30 minutes
      });
    }
  }, 500); // Delay to prioritize more important data
};

/**
 * Pre-fetches data for popular locations to make subsequent
 * navigation to these locations faster
 */
export const prefetchPopularLocations = (queryClient: QueryClient) => {
  // Beijing coordinates - commonly accessed location
  prefetchLocationData(queryClient, 39.9042, 116.4074);
  
  // We could add other popular locations here if needed
};

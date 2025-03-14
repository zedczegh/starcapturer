
import { QueryClient } from '@tanstack/react-query';
import { fetchWeatherData, fetchLightPollutionData, fetchForecastData } from './api';

// Cache keys generator to ensure consistency
const generateCacheKeys = (latitude: number, longitude: number) => {
  const latKey = latitude.toFixed(4);
  const lngKey = longitude.toFixed(4);
  
  return {
    weatherKey: ['weather', latKey, lngKey],
    lightPollutionKey: ['lightPollution', latKey, lngKey],
    forecastKey: ['forecast', latKey, lngKey],
    siqsDetailsKey: ['siqsDetails', latKey, lngKey]
  };
};

/**
 * Pre-fetches common location data to improve page transition speed
 * Called before navigation to have data ready when the page loads
 */
export const prefetchLocationData = async (
  queryClient: QueryClient, 
  latitude: number, 
  longitude: number
) => {
  const { weatherKey, lightPollutionKey, forecastKey, siqsDetailsKey } = generateCacheKeys(latitude, longitude);
  
  // Use Promise.all to fetch data in parallel
  await Promise.all([
    // Prefetch weather data
    !queryClient.getQueryData(weatherKey) && 
      queryClient.prefetchQuery({
        queryKey: weatherKey,
        queryFn: () => fetchWeatherData({ latitude, longitude }),
        staleTime: 5 * 60 * 1000 // 5 minutes
      }),
    
    // Prefetch light pollution data
    !queryClient.getQueryData(lightPollutionKey) && 
      queryClient.prefetchQuery({
        queryKey: lightPollutionKey,
        queryFn: () => fetchLightPollutionData(latitude, longitude),
        staleTime: 60 * 60 * 1000 // 1 hour
      })
  ]);
  
  // Lower priority data can be fetched after the main data
  if (!queryClient.getQueryData(forecastKey)) {
    setTimeout(() => {
      queryClient.fetchQuery({
        queryKey: forecastKey,
        queryFn: () => fetchForecastData({ 
          latitude, 
          longitude, 
          days: 3 
        }),
        staleTime: 30 * 60 * 1000 // 30 minutes
      });
    }, 100); // Reduced timeout from 500ms to 100ms
  }
};

/**
 * Pre-fetches data specifically for SIQS detail view
 * Called on hover or when a user is likely to view SIQS details
 */
export const prefetchSIQSDetails = (
  queryClient: QueryClient,
  latitude: number,
  longitude: number
) => {
  const { forecastKey } = generateCacheKeys(latitude, longitude);
  
  // Preload forecast data which is needed for SIQS details
  if (!queryClient.getQueryData(forecastKey)) {
    queryClient.prefetchQuery({
      queryKey: forecastKey,
      queryFn: () => fetchForecastData({ 
        latitude, 
        longitude, 
        days: 3 
      }),
      staleTime: 30 * 60 * 1000 // 30 minutes
    });
  }
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

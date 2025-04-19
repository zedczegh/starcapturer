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
 */
export const prefetchLocationData = async (
  queryClient: QueryClient, 
  latitude: number, 
  longitude: number
) => {
  const { weatherKey, lightPollutionKey, forecastKey } = generateCacheKeys(latitude, longitude);
  
  // Use Promise.allSettled to fetch all data in parallel without blocking on errors
  const results = await Promise.allSettled([
    // Fetch weather and light pollution in parallel
    queryClient.fetchQuery({
      queryKey: weatherKey,
      queryFn: () => fetchWeatherData({ latitude, longitude }),
      staleTime: 5 * 60 * 1000 // 5 minutes
    }),
    queryClient.fetchQuery({
      queryKey: lightPollutionKey,
      queryFn: () => fetchLightPollutionData(latitude, longitude),
      staleTime: 60 * 60 * 1000 // 1 hour
    }),
    // Also fetch forecast data in parallel
    queryClient.fetchQuery({
      queryKey: forecastKey,
      queryFn: () => fetchForecastData({ 
        latitude, 
        longitude, 
        days: 3 
      }),
      staleTime: 30 * 60 * 1000 // 30 minutes
    })
  ]);

  console.log("Prefetch results:", results.map(r => r.status));
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
  const { lightPollutionKey, forecastKey } = generateCacheKeys(latitude, longitude);
  
  // Always get fresh light pollution data
  queryClient.fetchQuery({
    queryKey: lightPollutionKey,
    queryFn: () => fetchLightPollutionData(latitude, longitude),
    staleTime: 60 * 60 * 1000 // 1 hour
  });
  
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
  
  // Add Guangzhou as a popular location for faster access
  prefetchLocationData(queryClient, 23.1291, 113.2644);
};

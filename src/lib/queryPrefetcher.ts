
import { QueryClient } from '@tanstack/react-query';
import { fetchWeatherData, fetchLightPollutionData, fetchForecastData } from './api';
import { generateCacheKeys } from './cache/cacheKeyGenerator';
import { prefetchCommonData } from './cache/prefetchUtils';

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
  
  // Always fetch the light pollution data first as it's critical for accurate SIQS
  try {
    // Force refresh light pollution data
    await queryClient.fetchQuery({
      queryKey: lightPollutionKey,
      queryFn: () => fetchLightPollutionData(latitude, longitude),
      staleTime: 60 * 60 * 1000 // 1 hour
    });
  } catch (error) {
    console.error("Error prefetching light pollution data:", error);
  }
  
  // Use Promise.all to fetch remaining data in parallel
  await Promise.all([
    // Prefetch weather data
    !queryClient.getQueryData(weatherKey) && 
      queryClient.prefetchQuery({
        queryKey: weatherKey,
        queryFn: () => fetchWeatherData({ latitude, longitude }),
        staleTime: 5 * 60 * 1000 // 5 minutes
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
    }, 100);
  }
};

/**
 * Pre-fetches data specifically for SIQS detail view
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
 * Pre-fetches data for popular locations
 */
export const prefetchPopularLocations = (queryClient: QueryClient) => {
  // Beijing coordinates - commonly accessed location
  prefetchCommonData(queryClient, 39.9042, 116.4074);
  
  // Add Guangzhou as a popular location for faster access
  prefetchCommonData(queryClient, 23.1291, 113.2644);
};

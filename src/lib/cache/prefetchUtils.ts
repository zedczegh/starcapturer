
import { QueryClient } from '@tanstack/react-query';
import { fetchWeatherData, fetchLightPollutionData } from '../api';
import { generateCacheKeys } from './cacheKeyGenerator';

/**
 * Prefetches common data for popular locations with optimized strategy
 */
export const prefetchCommonData = (
  queryClient: QueryClient,
  latitude: number,
  longitude: number
) => {
  const { weatherKey, lightPollutionKey } = generateCacheKeys(latitude, longitude);
  
  // Use a tiered approach to minimize initial load impact
  
  // 1. First, prefetch critical light pollution data (small payload)
  queryClient.prefetchQuery({
    queryKey: lightPollutionKey,
    queryFn: () => fetchLightPollutionData(latitude, longitude),
    staleTime: 60 * 60 * 1000 // 1 hour
  });
  
  // 2. Then schedule weather data to load with a slight delay
  setTimeout(() => {
    queryClient.prefetchQuery({
      queryKey: weatherKey,
      queryFn: () => fetchWeatherData({ latitude, longitude }),
      staleTime: 5 * 60 * 1000 // 5 minutes
    });
  }, 200);
};

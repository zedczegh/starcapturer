import { QueryClient } from '@tanstack/react-query';
import { fetchWeatherData, fetchLightPollutionData, fetchForecastData, fetchLongRangeForecastData } from './api';

// Cache keys generator to ensure consistency
const generateCacheKeys = (latitude: number, longitude: number) => {
  const latKey = latitude.toFixed(4);
  const lngKey = longitude.toFixed(4);
  
  return {
    weatherKey: ['weather', latKey, lngKey],
    lightPollutionKey: ['lightPollution', latKey, lngKey],
    forecastKey: ['forecast', latKey, lngKey],
    siqsDetailsKey: ['siqsDetails', latKey, lngKey],
    longRangeForecastKey: ['longRangeForecast', latKey, lngKey]
  };
};

// Track prefetch requests to avoid duplicate work
const prefetchedLocations = new Set<string>();

/**
 * Pre-fetches common location data to improve page transition speed
 */
export const prefetchLocationData = async (
  queryClient: QueryClient, 
  latitude: number, 
  longitude: number
) => {
  // Create unique identifier for this location
  const locationKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
  
  // Skip if already prefetched recently
  if (prefetchedLocations.has(locationKey)) {
    console.log("Skipping prefetch for recently loaded location:", locationKey);
    return;
  }
  
  // Mark as prefetched
  prefetchedLocations.add(locationKey);
  
  // Clean up prefetch cache occasionally to prevent memory leaks
  if (prefetchedLocations.size > 50) {
    prefetchedLocations.clear();
  }
  
  const { weatherKey, lightPollutionKey, forecastKey, longRangeForecastKey } = generateCacheKeys(latitude, longitude);
  
  console.log("Prefetching data for location:", locationKey);
  
  // Use Promise.allSettled to fetch all data in parallel without blocking on errors
  try {
    const results = await Promise.allSettled([
      // Fetch weather data
      queryClient.prefetchQuery({
        queryKey: weatherKey,
        queryFn: () => fetchWeatherData({ latitude, longitude }),
        staleTime: 5 * 60 * 1000 // 5 minutes
      }),
      
      // Fetch light pollution data
      queryClient.prefetchQuery({
        queryKey: lightPollutionKey,
        queryFn: () => fetchLightPollutionData(latitude, longitude),
        staleTime: 60 * 60 * 1000 // 1 hour
      }),
      
      // Fetch forecast data
      queryClient.prefetchQuery({
        queryKey: forecastKey,
        queryFn: () => fetchForecastData({ latitude, longitude }),
        staleTime: 30 * 60 * 1000 // 30 minutes
      }),
      
      // Fetch long-range forecast data
      queryClient.prefetchQuery({
        queryKey: longRangeForecastKey,
        queryFn: () => fetchLongRangeForecastData({ latitude, longitude }),
        staleTime: 60 * 60 * 1000 // 1 hour
      })
    ]);
    
    // Log success/failure of each prefetch
    results.forEach((result, index) => {
      const queries = ['weather', 'light pollution', 'forecast', 'long-range forecast'];
      if (result.status === 'fulfilled') {
        console.log(`✓ Successfully prefetched ${queries[index]} data`);
      } else {
        console.error(`✗ Failed to prefetch ${queries[index]} data:`, result.reason);
      }
    });
    
  } catch (error) {
    console.error("Error during data prefetching:", error);
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
  const { lightPollutionKey, forecastKey } = generateCacheKeys(latitude, longitude);
  
  // Always get fresh light pollution data
  queryClient.prefetchQuery({
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

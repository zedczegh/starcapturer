
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import WeatherDataService from '@/services/weatherDataService';

interface WeatherDataIntegrationOptions {
  refreshInterval?: number;
  enabled?: boolean;
  onDataLoaded?: (data: any) => void;
  includeHistoricalData?: boolean;
}

/**
 * Custom hook for integrating weather and clear sky data
 * with enhanced support for certified locations
 */
export function useWeatherDataIntegration(
  latitude: number | null,
  longitude: number | null,
  options: WeatherDataIntegrationOptions = {}
) {
  const { 
    refreshInterval = 0, 
    enabled = true, 
    onDataLoaded,
    includeHistoricalData = true 
  } = options;
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Query for clear sky rate data with historical data support
  const {
    data: clearSkyData,
    isLoading: clearSkyLoading,
    isFetching: clearSkyFetching,
    refetch: refetchClearSky
  } = useQuery({
    queryKey: ['clearSkyRate', latitude, longitude, refreshKey, includeHistoricalData],
    queryFn: () => latitude && longitude 
      ? WeatherDataService.getClearSkyRate(latitude, longitude, false, includeHistoricalData)
      : null,
    enabled: !!latitude && !!longitude && enabled,
    staleTime: refreshInterval > 0 ? refreshInterval : 24 * 60 * 60 * 1000,
  });
  
  // Query for current weather data with shorter stale time
  const {
    data: weatherData,
    isLoading: weatherLoading,
    isFetching: weatherFetching,
    refetch: refetchWeather
  } = useQuery({
    queryKey: ['currentWeather', latitude, longitude, refreshKey],
    queryFn: () => latitude && longitude 
      ? WeatherDataService.getCurrentWeather(latitude, longitude)
      : null,
    enabled: !!latitude && !!longitude && enabled,
    staleTime: 15 * 60 * 1000, // Weather data stales faster (15 minutes)
  });
  
  // Historical weather patterns for specified location (if certified)
  const {
    data: historicalData,
    isLoading: historicalLoading,
    isFetching: historicalFetching
  } = useQuery({
    queryKey: ['historicalWeather', latitude, longitude, refreshKey],
    queryFn: () => latitude && longitude && includeHistoricalData
      ? WeatherDataService.getHistoricalWeatherPatterns(latitude, longitude)
      : null,
    enabled: !!latitude && !!longitude && enabled && includeHistoricalData,
    staleTime: 7 * 24 * 60 * 60 * 1000, // Historical data changes very slowly (1 week)
  });
  
  // Notify when data types are loaded
  useEffect(() => {
    if (onDataLoaded && clearSkyData && weatherData) {
      onDataLoaded({
        clearSky: clearSkyData,
        weather: weatherData,
        historical: historicalData
      });
    }
  }, [clearSkyData, weatherData, historicalData, onDataLoaded]);
  
  // Function to force refresh all data types
  const refresh = () => {
    setRefreshKey(prev => prev + 1);
    refetchClearSky();
    refetchWeather();
  };
  
  // Check if this is likely a certified location
  const isCertifiedLocation = !!(
    latitude && 
    longitude && 
    (clearSkyData?.isCertified || clearSkyData?.isDarkSkyReserve)
  );
  
  return {
    clearSkyData,
    weatherData,
    historicalData,
    loading: clearSkyLoading || weatherLoading || (includeHistoricalData && historicalLoading),
    fetching: clearSkyFetching || weatherFetching || (includeHistoricalData && historicalFetching),
    refresh,
    isCertifiedLocation,
    // Individual refresh functions
    refreshClearSky: refetchClearSky,
    refreshWeather: refetchWeather
  };
}

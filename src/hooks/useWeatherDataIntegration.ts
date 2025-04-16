
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import WeatherDataService from '@/services/weatherDataService';
import { ClearSkyRateData } from '@/lib/api/clearSkyRate';

interface WeatherDataIntegrationOptions {
  refreshInterval?: number;
  enabled?: boolean;
  onDataLoaded?: (data: any) => void;
}

/**
 * Custom hook for integrating weather and clear sky data
 */
export function useWeatherDataIntegration(
  latitude: number | null,
  longitude: number | null,
  options: WeatherDataIntegrationOptions = {}
) {
  const { refreshInterval = 0, enabled = true, onDataLoaded } = options;
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Query for clear sky rate data
  const {
    data: clearSkyData,
    isLoading: clearSkyLoading,
    isFetching: clearSkyFetching,
    refetch: refetchClearSky
  } = useQuery({
    queryKey: ['clearSkyRate', latitude, longitude, refreshKey],
    queryFn: () => latitude && longitude 
      ? WeatherDataService.getClearSkyRate(latitude, longitude)
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
  
  // Notify when both data types are loaded
  useEffect(() => {
    if (onDataLoaded && clearSkyData && weatherData) {
      onDataLoaded({
        clearSky: clearSkyData,
        weather: weatherData
      });
    }
  }, [clearSkyData, weatherData, onDataLoaded]);
  
  // Function to force refresh both data types
  const refresh = () => {
    setRefreshKey(prev => prev + 1);
    refetchClearSky();
    refetchWeather();
  };
  
  return {
    clearSkyData,
    weatherData,
    loading: clearSkyLoading || weatherLoading,
    fetching: clearSkyFetching || weatherFetching,
    refresh,
    // Individual refresh functions
    refreshClearSky: refetchClearSky,
    refreshWeather: refetchWeather
  };
}

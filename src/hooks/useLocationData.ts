
import { useState, useCallback } from 'react';
import { getWeatherData, getBortleScaleData } from '@/services/environmentalDataService';
import { getLocationNameForCoordinates } from '@/components/location/map/LocationNameService';
import { Language } from '@/services/geocoding/types';

// Global cache to reduce API calls
const dataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutes

export const useLocationDataCache = () => {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [locationData, setLocationData] = useState<any>(null);
  const [bortleScale, setBortleScale] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Cache management functions
  const getCachedData = useCallback((key: string, maxAge: number = CACHE_LIFETIME) => {
    const cached = dataCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      return cached.data;
    }
    return null;
  }, []);

  const setCachedData = useCallback((key: string, data: any) => {
    dataCache.set(key, { data, timestamp: Date.now() });
  }, []);

  const clearCache = useCallback((keys?: string[]) => {
    if (keys) {
      keys.forEach(key => dataCache.delete(key));
    } else {
      dataCache.clear();
    }
  }, []);

  // Get location name from coordinates
  const getLocationName = useCallback(async (
    latitude: number, 
    longitude: number,
    language: Language = 'en'
  ): Promise<string> => {
    try {
      const locationName = await getLocationNameForCoordinates(
        latitude, 
        longitude, 
        language,
        { setCachedData, getCachedData }
      );
      return locationName || '';
    } catch (err) {
      console.error('Error getting location name:', err);
      return '';
    }
  }, [getCachedData, setCachedData]);

  // Get location data from name or coordinates
  const getLocationData = useCallback(async (
    locationName: string | null,
    latitude?: number,
    longitude?: number,
    language: Language = 'en'
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // If we have coordinates, use them directly
      if (latitude !== undefined && longitude !== undefined) {
        // Fetch weather data for the coordinates
        const weatherResponse = await getWeatherData(
          latitude,
          longitude,
          'weather-data',
          getCachedData,
          setCachedData,
          false,
          language
        );
        
        // Fetch Bortle scale data
        const bortle = await getBortleScaleData(
          latitude,
          longitude,
          locationName || await getLocationName(latitude, longitude, language),
          null,
          false,
          getCachedData,
          setCachedData,
          language
        );
        
        const result = {
          name: locationName || await getLocationName(latitude, longitude, language),
          latitude,
          longitude,
          bortleScale: bortle
        };
        
        setWeatherData(weatherResponse);
        setLocationData(result);
        setBortleScale(bortle);
        
        setLoading(false);
        return result;
      }
      
      // If we only have location name, call geocode API
      if (locationName) {
        // TODO: Implement geocoding here
        // This would convert a location name to coordinates
        // For now we'll throw an error
        throw new Error('Geocoding not implemented');
      }
      
      throw new Error('Either location name or coordinates are required');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      setLoading(false);
      return null;
    }
  }, [getCachedData, setCachedData, getLocationName]);

  return {
    loading,
    error,
    weatherData,
    locationData,
    bortleScale,
    getLocationData,
    getLocationName,
    getCachedData,
    setCachedData,
    clearCache
  };
};

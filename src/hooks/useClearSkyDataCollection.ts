
import { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clearSkyDataCollector } from '@/services/clearSky/clearSkyDataCollector';
import { fetchWeatherData } from '@/lib/api/weather';

interface UseClearSkyDataCollectionProps {
  latitude: number | null;
  longitude: number | null;
  enabled?: boolean;
  autoCollect?: boolean;
  collectInterval?: number;
}

/**
 * Hook to manage clear sky data collection and integration
 */
export function useClearSkyDataCollection({
  latitude,
  longitude,
  enabled = true,
  autoCollect = true,
  collectInterval = 24 * 60 * 60 * 1000 // Default: collect once per day
}: UseClearSkyDataCollectionProps) {
  const [lastCollectionTime, setLastCollectionTime] = useState<number | null>(null);
  const [collectionStats, setCollectionStats] = useState({
    observationsCount: 0,
    lastUpdated: null as string | null
  });
  
  // Fetch current weather data for observation
  const { data: weatherData, refetch: refetchWeather } = useQuery({
    queryKey: ['weather-for-observation', latitude, longitude],
    queryFn: () => latitude && longitude ? fetchWeatherData({ latitude, longitude }) : null,
    enabled: enabled && !!latitude && !!longitude && autoCollect,
    staleTime: collectInterval,
    refetchInterval: collectInterval,
  });
  
  // Function to record current observation
  const recordCurrentObservation = useCallback(() => {
    if (!latitude || !longitude || !weatherData) return false;
    
    try {
      // Extract cloud cover and visibility
      const cloudCover = weatherData.cloudCover || 0;
      // Use visibility if available, otherwise calculate from cloud cover
      const visibility = weatherData.visibility !== undefined 
        ? weatherData.visibility 
        : (100 - (cloudCover * 0.8)); // Estimate visibility inversely to cloud cover
      
      // Record station data
      clearSkyDataCollector.recordStationData(
        latitude,
        longitude,
        cloudCover,
        visibility
      );
      
      setLastCollectionTime(Date.now());
      console.log(`Recorded clear sky observation at [${latitude}, ${longitude}]`);
      
      // Update stats
      const observations = clearSkyDataCollector.getObservationsForLocation(latitude, longitude, 10);
      setCollectionStats({
        observationsCount: observations.length,
        lastUpdated: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error("Failed to record observation:", error);
      return false;
    }
  }, [latitude, longitude, weatherData]);
  
  // Record manual observation with custom values
  const recordManualObservation = useCallback((cloudCover: number, visibility: number) => {
    if (!latitude || !longitude) return false;
    
    try {
      clearSkyDataCollector.recordUserObservation(
        latitude,
        longitude,
        cloudCover,
        visibility
      );
      
      setLastCollectionTime(Date.now());
      console.log(`Recorded manual clear sky observation at [${latitude}, ${longitude}]`);
      
      // Update stats
      const observations = clearSkyDataCollector.getObservationsForLocation(latitude, longitude, 10);
      setCollectionStats({
        observationsCount: observations.length,
        lastUpdated: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error("Failed to record manual observation:", error);
      return false;
    }
  }, [latitude, longitude]);
  
  // Auto collect data when weather data changes
  useEffect(() => {
    if (!autoCollect || !weatherData || !enabled) return;
    
    // Check if enough time has passed since last collection
    const now = Date.now();
    if (lastCollectionTime && now - lastCollectionTime < collectInterval * 0.9) {
      console.log("Skipping collection as it was recently done");
      return;
    }
    
    recordCurrentObservation();
  }, [weatherData, autoCollect, enabled, lastCollectionTime, collectInterval, recordCurrentObservation]);
  
  // Load initial stats
  useEffect(() => {
    if (!latitude || !longitude || !enabled) return;
    
    const observations = clearSkyDataCollector.getObservationsForLocation(latitude, longitude, 10);
    setCollectionStats({
      observationsCount: observations.length,
      lastUpdated: observations.length > 0 ? observations[0].timestamp : null
    });
  }, [latitude, longitude, enabled]);
  
  // Calculate clear sky rate from collected observations
  const getCalculatedClearSkyRate = useCallback(() => {
    if (!latitude || !longitude) return null;
    
    return clearSkyDataCollector.calculateClearSkyRate(latitude, longitude);
  }, [latitude, longitude]);
  
  return {
    recordCurrentObservation,
    recordManualObservation,
    refetchWeather,
    getCalculatedClearSkyRate,
    weatherData,
    collectionStats,
    lastCollectionTime,
    exportData: clearSkyDataCollector.exportCollectedData,
    clearData: clearSkyDataCollector.clearAllData
  };
}

export default useClearSkyDataCollection;

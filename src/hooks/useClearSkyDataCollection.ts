
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
      
      // Record station data - Using addObservation instead of recordStationData
      clearSkyDataCollector.addObservation(
        latitude,
        longitude,
        cloudCover // Using cloudCover as clearSkyRate
      );
      
      setLastCollectionTime(Date.now());
      console.log(`Recorded clear sky observation at [${latitude}, ${longitude}]`);
      
      // Update stats using getUserObservations
      const observations = clearSkyDataCollector.getUserObservations("");
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
      // Using addObservation instead of recordUserObservation
      clearSkyDataCollector.addObservation(
        latitude,
        longitude,
        100 - cloudCover // Convert cloudCover to clearSkyRate (inverse relationship)
      );
      
      setLastCollectionTime(Date.now());
      console.log(`Recorded manual clear sky observation at [${latitude}, ${longitude}]`);
      
      // Update stats using getUserObservations
      const observations = clearSkyDataCollector.getUserObservations("");
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
    
    // Get user observations
    const observations = clearSkyDataCollector.getUserObservations("");
    // Use the timestamp of the first observation or null if none
    const lastUpdated = observations.length > 0 
      ? observations[0].timestamp 
      : null;
    
    setCollectionStats({
      observationsCount: observations.length,
      lastUpdated
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
    // Use available methods for missing functions
    exportData: () => clearSkyDataCollector.getUserObservations(""), // Placeholder for exportCollectedData
    clearData: () => clearSkyDataCollector.clearObservations() // Placeholder for clearAllData
  };
}

export default useClearSkyDataCollection;

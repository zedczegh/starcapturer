
import { useState, useCallback, useEffect } from 'react';
import { calculateSIQS } from '@/lib/calculateSIQS';
import { fetchForecastData } from '@/lib/api';
import { normalizeScore } from '@/hooks/siqs/siqsCalculationUtils';

/**
 * Hook for managing location details and related calculations
 */
export function useLocationDetails(initialData: any = null) {
  const [locationData, setLocationData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState(null);
  
  // Update forecast data when location changes
  useEffect(() => {
    if (!locationData?.latitude || !locationData?.longitude) return;
    
    const fetchForecast = async () => {
      try {
        const forecast = await fetchForecastData({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          days: 3
        });
        
        setForecastData(forecast);
      } catch (error) {
        console.error("Error fetching forecast data:", error);
      }
    };
    
    fetchForecast();
  }, [locationData?.latitude, locationData?.longitude]);
  
  /**
   * Update location details including weather and SIQS data
   */
  const updateLocationDetails = useCallback(async (data: any = null) => {
    if (!data) return;
    
    setLoading(true);
    
    try {
      // Check if we have all required data for SIQS calculation
      const hasSIQSData = data.bortleScale && data.weatherData;
      
      if (hasSIQSData) {
        const siqsScore = await calculateSIQS({
          bortleScale: data.bortleScale,
          cloudCover: data.weatherData.cloudCover,
          humidity: data.weatherData.humidity,
          moonPhase: data.moonPhase || 0.5,
          seeingConditions: data.seeingConditions || 3,
          windSpeed: data.weatherData.windSpeed,
          aqi: data.weatherData.aqi,
          weatherCondition: data.weatherData.weatherCondition,
          precipitation: data.weatherData.precipitation
        });
        
        setLocationData({
          ...data,
          siqsResult: {
            ...siqsScore,
            score: normalizeScore(siqsScore.score)
          },
          timestamp: new Date().toISOString()
        });
      } else {
        setLocationData(data);
      }
    } catch (error) {
      console.error("Error updating location details:", error);
      setLocationData(data);
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Update specific location properties
   */
  const updateLocationProperty = useCallback((key: string, value: any) => {
    setLocationData(current => {
      if (!current) return current;
      return {
        ...current,
        [key]: value,
        timestamp: new Date().toISOString()
      };
    });
  }, []);
  
  /**
   * Refresh SIQS calculation for current location
   */
  const refreshSIQS = useCallback(async () => {
    if (!locationData?.bortleScale || !locationData?.weatherData) return;
    
    try {
      setLoading(true);
      
      const siqsScore = await calculateSIQS({
        bortleScale: locationData.bortleScale,
        cloudCover: locationData.weatherData.cloudCover,
        humidity: locationData.weatherData.humidity,
        moonPhase: locationData.moonPhase || 0.5,
        seeingConditions: locationData.seeingConditions || 3,
        windSpeed: locationData.weatherData.windSpeed,
        aqi: locationData.weatherData.aqi,
        weatherCondition: locationData.weatherData.weatherCondition,
        precipitation: locationData.weatherData.precipitation
      });
      
      setLocationData(current => ({
        ...current,
        siqsResult: {
          ...siqsScore,
          score: normalizeScore(siqsScore.score)
        },
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error("Error refreshing SIQS:", error);
    } finally {
      setLoading(false);
    }
  }, [locationData]);
  
  return {
    locationData,
    setLocationData,
    loading,
    forecastData,
    updateLocationDetails,
    updateLocationProperty,
    refreshSIQS
  };
}

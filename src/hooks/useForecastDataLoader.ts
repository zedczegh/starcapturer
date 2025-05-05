
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchForecastData, fetchLongRangeForecastData } from '@/lib/api';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { areValidCoordinates } from '@/lib/api/coordinates';

export const useForecastDataLoader = (
  latitude: number | undefined, 
  longitude: number | undefined
) => {
  const { language } = useLanguage();
  const [forecastData, setForecastData] = useState<any | null>(null);
  const [longRangeForecastData, setLongRangeForecastData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load forecast data with improved error handling
  const loadForecastData = useCallback(async () => {
    if (!areValidCoordinates(latitude, longitude)) {
      console.warn("Invalid coordinates provided to useForecastDataLoader:", { latitude, longitude });
      return;
    }

    // Prevent multiple simultaneous loading
    if (loadingRef.current) {
      console.log("Forecast data already loading, request ignored");
      return;
    }

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setError(null);
    loadingRef.current = true;

    try {
      // Load both forecast data types in parallel with timeout
      const [forecast, longRangeForecast] = await Promise.all([
        fetchForecastData({ 
          latitude: latitude!, 
          longitude: longitude! 
        }, { 
          signal 
        }),
        fetchLongRangeForecastData({ 
          latitude: latitude!, 
          longitude: longitude!
        }, {
          signal
        })
      ]);

      // Only update state if not aborted
      if (!signal.aborted) {
        setForecastData(forecast);
        setLongRangeForecastData(longRangeForecast);
      }
    } catch (err) {
      // Only update error state if not aborted
      if (!signal.aborted) {
        console.error('Error loading forecast data:', err);
        setError(err as Error);
        
        toast.error(
          language === 'en' ? 'Failed to load forecast data' : '加载预报数据失败',
          {
            description: language === 'en' 
              ? 'Please check your connection and try again' 
              : '请检查您的连接并重试'
          }
        );
      }
    } finally {
      // Only update loading state if not aborted
      if (!signal.aborted) {
        setLoading(false);
        loadingRef.current = false;
      }
    }
  }, [latitude, longitude, language]);

  // Load forecast data when coordinates change
  useEffect(() => {
    loadForecastData();
    
    // Cleanup function - abort any in-flight requests when unmounting
    // or when coordinates change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      loadingRef.current = false;
    };
  }, [latitude, longitude, loadForecastData]);

  return { 
    forecastData, 
    longRangeForecastData, 
    loading, 
    error,
    reloadForecast: loadForecastData 
  };
};

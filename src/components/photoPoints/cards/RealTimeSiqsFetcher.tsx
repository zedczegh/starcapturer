
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { calculateAstronomicalNight, formatTime } from '@/utils/astronomy/nightTimeCalculator';

interface RealTimeSiqsFetcherProps {
  isVisible: boolean;
  showRealTimeSiqs: boolean;
  latitude?: number;
  longitude?: number;
  bortleScale?: number;
  onSiqsCalculated: (siqs: number | null, loading: boolean) => void;
}

// Throttle/debounce utility for SIQS calculations
const useSiqsThrottle = () => {
  const lastFetch = useRef<number>(0);
  const throttleDuration = 5 * 60 * 1000; // 5 minutes
  
  const shouldFetch = useCallback((latitude?: number, longitude?: number): boolean => {
    if (!latitude || !longitude) return false;
    
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetch.current;
    
    // Always fetch if this is the first request or enough time has passed
    if (lastFetch.current === 0 || timeSinceLastFetch > throttleDuration) {
      lastFetch.current = now;
      return true;
    }
    
    return false;
  }, []);
  
  const resetThrottle = useCallback(() => {
    lastFetch.current = 0;
  }, []);
  
  return { shouldFetch, resetThrottle, lastFetchTime: lastFetch };
};

const RealTimeSiqsFetcher: React.FC<RealTimeSiqsFetcherProps> = ({
  isVisible,
  showRealTimeSiqs,
  latitude,
  longitude,
  bortleScale = 5,
  onSiqsCalculated
}) => {
  const [loading, setLoading] = useState(false);
  const { shouldFetch, lastFetchTime } = useSiqsThrottle();
  const lastCoordinates = useRef<string | null>(null);
  
  // Memoize the fetch function to prevent recreation on every render
  const fetchSiqs = useCallback(async () => {
    if (!latitude || !longitude) return;
    
    const coordinatesKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    
    // Skip if coordinates haven't changed and we fetched recently
    if (coordinatesKey === lastCoordinates.current && 
        Date.now() - lastFetchTime.current < 5 * 60 * 1000) {
      return;
    }
    
    lastCoordinates.current = coordinatesKey;
    setLoading(true);
    onSiqsCalculated(null, true);
    
    try {
      const effectiveBortleScale = bortleScale || (showRealTimeSiqs ? 3 : 5);
      
      // Try to get cached data from sessionStorage first
      const cacheKey = `siqs_${coordinatesKey}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const age = Date.now() - timestamp;
        
        if (age < 5 * 60 * 1000) { // 5 minutes cache
          onSiqsCalculated(data.siqs, false);
          setLoading(false);
          return;
        }
      }
      
      // If we have coordinates, calculate astronomical night for logging purposes
      if (latitude && longitude) {
        const { start, end } = calculateAstronomicalNight(latitude, longitude);
        console.log(`Astronomical night for this location: ${formatTime(start)}-${formatTime(end)}`);
      }
      
      const result = await calculateRealTimeSiqs(
        latitude,
        longitude,
        effectiveBortleScale
      );
      
      if (result && result.siqs > 0) {
        onSiqsCalculated(result.siqs, false);
      } else {
        onSiqsCalculated(0, false);
      }
    } catch (error) {
      console.error("Error fetching real-time SIQS:", error);
      onSiqsCalculated(null, false);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, bortleScale, showRealTimeSiqs, onSiqsCalculated, lastFetchTime]);
  
  // Use a more efficient effect trigger
  useEffect(() => {
    if (showRealTimeSiqs && isVisible && latitude && longitude && 
        shouldFetch(latitude, longitude)) {
      
      // Use a small timeout to allow component mounting before heavy calculation
      const timer = setTimeout(() => fetchSiqs(), 50);
      return () => clearTimeout(timer);
    }
  }, [latitude, longitude, showRealTimeSiqs, isVisible, shouldFetch, fetchSiqs]);
  
  return null;
};

export default React.memo(RealTimeSiqsFetcher);

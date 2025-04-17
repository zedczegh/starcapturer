
import React, { useState, useEffect } from 'react';
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

const RealTimeSiqsFetcher: React.FC<RealTimeSiqsFetcherProps> = ({
  isVisible,
  showRealTimeSiqs,
  latitude,
  longitude,
  bortleScale = 5,
  onSiqsCalculated
}) => {
  const [loading, setLoading] = useState(false);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration
  
  useEffect(() => {
    if (showRealTimeSiqs && isVisible && latitude && longitude) {
      const now = Date.now();
      const shouldFetch = now - lastFetchTimestamp > CACHE_DURATION;
      
      if (shouldFetch) {
        console.log(`Fetching real-time SIQS for location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        const fetchSiqs = async () => {
          setLoading(true);
          onSiqsCalculated(null, true);
          
          try {
            const effectiveBortleScale = bortleScale || 
              (showRealTimeSiqs ? 3 : 5);
            
            // Try to get cached data from sessionStorage first
            const cacheKey = `siqs_${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
            const cachedData = sessionStorage.getItem(cacheKey);
            
            if (cachedData) {
              const { data, timestamp } = JSON.parse(cachedData);
              const age = now - timestamp;
              
              if (age < CACHE_DURATION) {
                console.log("Using cached SIQS from session storage");
                onSiqsCalculated(data.siqs, false);
                setLastFetchTimestamp(timestamp);
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
              console.log(`Calculated SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}: ${result.siqs}`);
              
              // Cache the result in sessionStorage
              sessionStorage.setItem(cacheKey, JSON.stringify({
                data: result,
                timestamp: now
              }));
              
              onSiqsCalculated(result.siqs, false);
            } else {
              onSiqsCalculated(0, false);
            }
            setLastFetchTimestamp(now);
          } catch (error) {
            console.error("Error fetching real-time SIQS:", error);
            onSiqsCalculated(null, false);
          } finally {
            setLoading(false);
          }
        };
        
        fetchSiqs();
      }
    }
  }, [latitude, longitude, showRealTimeSiqs, isVisible, bortleScale, onSiqsCalculated, lastFetchTimestamp]);
  
  return null;
};

export default RealTimeSiqsFetcher;


import React, { useState, useEffect } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';
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
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  
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
            const effectiveBortleScale = bortleScale || 4;
            
            // Try to get cached data from sessionStorage first
            const cacheKey = `siqs_${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
            const cachedData = sessionStorage.getItem(cacheKey);
            
            if (cachedData) {
              const { data, timestamp } = JSON.parse(cachedData);
              const age = now - timestamp;
              
              // Use cached data if it's fresh enough
              if (age < CACHE_DURATION) {
                console.log(`Using cached SIQS data (${(age/1000).toFixed(0)}s old) for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                onSiqsCalculated(data.score, false);
                setLoading(false);
                return;
              }
            }
            
            // Calculate fresh data
            const result = await calculateRealTimeSiqs(latitude, longitude, effectiveBortleScale);
            
            if (result && typeof result.score === 'number') {
              // Cache the result
              try {
                sessionStorage.setItem(cacheKey, JSON.stringify({
                  data: result,
                  timestamp: now
                }));
              } catch (e) {
                console.warn("Failed to cache SIQS data:", e);
              }
              
              console.log(`Real-time SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}: ${result.score.toFixed(1)}`);
              onSiqsCalculated(result.score, false);
            } else {
              onSiqsCalculated(null, false);
            }
          } catch (error) {
            console.error("Error fetching SIQS data:", error);
            onSiqsCalculated(null, false);
          }
          
          setLoading(false);
          setLastFetchTimestamp(now);
        };
        
        fetchSiqs();
      }
    }
  }, [isVisible, showRealTimeSiqs, latitude, longitude, bortleScale, lastFetchTimestamp, onSiqsCalculated]);
  
  return null; // This component doesn't render anything
};

export default RealTimeSiqsFetcher;

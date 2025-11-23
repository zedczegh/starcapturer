
import React, { useState, useEffect } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { detectAndFixAnomalies, assessDataReliability } from '@/services/realTimeSiqs/siqsAnomalyDetector';
import { WeatherDataWithClearSky } from '@/services/realTimeSiqs/siqsTypes';
import { useSiqsCache } from '@/hooks/cache/useSiqsCache';

interface RealTimeSiqsFetcherProps {
  isVisible: boolean;
  showRealTimeSiqs: boolean;
  latitude?: number;
  longitude?: number;
  bortleScale?: number;
  onSiqsCalculated: (siqs: number | null, loading: boolean) => void;
  source?: 'calculator' | 'photopoint' | 'community' | 'search';
  spotId?: string;
}

// Track pending calculations to prevent duplicates
const pendingCalculations = new Map<string, Promise<any>>();

const RealTimeSiqsFetcher: React.FC<RealTimeSiqsFetcherProps> = ({
  isVisible,
  showRealTimeSiqs,
  latitude,
  longitude,
  bortleScale = 5,
  onSiqsCalculated,
  source,
  spotId
}) => {
  const [loading, setLoading] = useState(false);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number>(0);
  const { getCachedSiqs, cacheSiqs } = useSiqsCache();
  
  useEffect(() => {
    if (!showRealTimeSiqs || !isVisible || !latitude || !longitude) {
      setLoading(false);
      return;
    }
    
    const cacheKey = `${latitude.toFixed(6)}_${longitude.toFixed(6)}_${bortleScale}`;
    const now = Date.now();
    
    const fetchSiqs = async () => {
      try {
        // Check centralized cache first (1 hour TTL)
        const cachedSiqs = getCachedSiqs(latitude, longitude);
        if (cachedSiqs !== null && cachedSiqs > 0) {
          onSiqsCalculated(cachedSiqs, false);
          setLoading(false);
          return;
        }

        // Check if calculation is already pending
        if (pendingCalculations.has(cacheKey)) {
          setLoading(true);
          onSiqsCalculated(null, true);
          
          pendingCalculations.get(cacheKey)!
            .then((result) => {
              if (result && result.siqs > 0) {
                onSiqsCalculated(result.siqs, false);
                cacheSiqs(latitude, longitude, result.siqs);
              }
            })
            .catch(() => onSiqsCalculated(null, false))
            .finally(() => setLoading(false));
            
          return;
        }
        
        // Start new calculation
        setLoading(true);
        onSiqsCalculated(null, true);
        
        const effectiveBortleScale = bortleScale || (showRealTimeSiqs ? 3 : 5);
        
        const calculationPromise = calculateRealTimeSiqs(
          latitude, 
          longitude, 
          effectiveBortleScale,
          {
            useSingleHourSampling: true,
            targetHour: 1,
            cacheDurationMins: 60, // 1 hour cache
            source: source,
            spotId: spotId
          }
        ).then(result => {
          if (result && result.siqs > 0) {
            const weatherData = result.weatherData || { 
              cloudCover: 0, 
              precipitation: 0,
              latitude, 
              longitude,
              temperature: 0,
              humidity: 0,
              windSpeed: 0
            } as WeatherDataWithClearSky;
            
            const correctedResult = detectAndFixAnomalies(
              result,
              weatherData,
              { latitude, longitude }
            );
            
            const reliability = assessDataReliability(weatherData, result.forecastData);
            
            let finalSiqs: number;
            if (reliability.reliable) {
              finalSiqs = correctedResult.siqs;
            } else {
              finalSiqs = correctedResult.siqs > 10 ? 
                correctedResult.siqs / 10 : correctedResult.siqs;
              finalSiqs *= (reliability.confidenceScore / 10);
            }
            
            // Cache the result
            cacheSiqs(latitude, longitude, finalSiqs);
            
            onSiqsCalculated(finalSiqs, false);
            return { siqs: finalSiqs };
          }
          
          onSiqsCalculated(0, false);
          return result;
        }).catch(error => {
          console.error("Error calculating SIQS:", error);
          onSiqsCalculated(null, false);
          throw error;
        }).finally(() => {
          setLoading(false);
          setLastFetchTimestamp(now);
          pendingCalculations.delete(cacheKey);
        });
        
        pendingCalculations.set(cacheKey, calculationPromise);
      } catch (error) {
        console.error('Error in fetchSiqs:', error);
        onSiqsCalculated(null, false);
        setLoading(false);
      }
    };
    
    // Fetch if we haven't fetched in the last hour
    const shouldFetch = now - lastFetchTimestamp > 60 * 60 * 1000; // 1 hour
    if (shouldFetch) {
      setLastFetchTimestamp(now);
      fetchSiqs();
    }
  }, [latitude, longitude, showRealTimeSiqs, isVisible, bortleScale, onSiqsCalculated, lastFetchTimestamp, getCachedSiqs, cacheSiqs, source, spotId]);

  return null;
};

export default React.memo(RealTimeSiqsFetcher);

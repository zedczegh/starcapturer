
import React, { useState, useEffect } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { hasCachedSiqs, getCachedSiqs } from '@/services/realTimeSiqs/siqsCache';
import { detectAndFixAnomalies, assessDataReliability } from '@/services/realTimeSiqs/siqsAnomalyDetector';
import { WeatherDataWithClearSky } from '@/services/realTimeSiqs/siqsTypes';

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

// In-memory cache across component instances
const siqsResultCache = new Map<string, {siqs: number, timestamp: number}>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
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
  
  useEffect(() => {
    if (!showRealTimeSiqs || !isVisible || !latitude || !longitude) return;
    
    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${bortleScale}`;
    const now = Date.now();
    
    // Check memory cache first (fastest)
    const memoCached = siqsResultCache.get(cacheKey);
    if (memoCached && (now - memoCached.timestamp) < CACHE_DURATION) {
      console.log("Using in-memory cached SIQS");
      onSiqsCalculated(memoCached.siqs, false);
      return;
    }
    
    // Then check persistent cache
    if (hasCachedSiqs(latitude, longitude)) {
      const cachedData = getCachedSiqs(latitude, longitude);
      if (cachedData && (now - new Date(cachedData.metadata?.calculatedAt || 0).getTime()) < CACHE_DURATION) {
        console.log("Using persistent cached SIQS");
        onSiqsCalculated(cachedData.siqs, false);
        
        // Update memory cache
        siqsResultCache.set(cacheKey, {
          siqs: cachedData.siqs,
          timestamp: now
        });
        
        return;
      }
    }

    // Check if we should fetch fresh data
    const shouldFetch = now - lastFetchTimestamp > CACHE_DURATION;
    
    if (shouldFetch) {
      console.log(`Fetching real-time SIQS for location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      
      // Check if a calculation is already pending for these coordinates
      if (pendingCalculations.has(cacheKey)) {
        console.log("Reusing pending SIQS calculation");
        setLoading(true);
        onSiqsCalculated(null, true);
        
        // Reuse the existing promise
        pendingCalculations.get(cacheKey)!
          .then((result) => {
            if (result && result.siqs > 0) {
              onSiqsCalculated(result.siqs, false);
              
              // Update cache
              siqsResultCache.set(cacheKey, {
                siqs: result.siqs,
                timestamp: Date.now()
              });
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
          cacheDurationMins: 5,
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
          
          // Update memory cache
          siqsResultCache.set(cacheKey, {
            siqs: finalSiqs,
            timestamp: Date.now()
          });
          
          onSiqsCalculated(finalSiqs, false);
          return result;
        }
        
        onSiqsCalculated(0, false);
        return result;
      }).catch(error => {
        console.error("Error fetching real-time SIQS:", error);
        onSiqsCalculated(null, false);
        throw error;
      }).finally(() => {
        setLoading(false);
        setLastFetchTimestamp(now);
        pendingCalculations.delete(cacheKey);
      });
      
      // Store the promise to allow other components to reuse it
      pendingCalculations.set(cacheKey, calculationPromise);
    }
  }, [latitude, longitude, showRealTimeSiqs, isVisible, bortleScale, onSiqsCalculated, lastFetchTimestamp]);

  return null;
};

export default React.memo(RealTimeSiqsFetcher);

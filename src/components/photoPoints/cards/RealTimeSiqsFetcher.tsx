
import React, { useState, useEffect, useRef } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { hasCachedSiqs, getCachedSiqs, setSiqsCache } from '@/services/realTimeSiqs/siqsCache';
import { detectAndFixAnomalies, assessDataReliability } from '@/services/realTimeSiqs/siqsAnomalyDetector';
import { WeatherDataWithClearSky } from '@/services/realTimeSiqs/siqsTypes';

interface RealTimeSiqsFetcherProps {
  isVisible: boolean;
  showRealTimeSiqs: boolean;
  latitude?: number;
  longitude?: number;
  bortleScale?: number;
  onSiqsCalculated: (siqs: number | null, loading: boolean, confidence?: number) => void;
  forceUpdate?: boolean;
}

// In-memory cache across component instances
const siqsResultCache = new Map<string, {siqs: number, confidence: number, timestamp: number}>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const pendingCalculations = new Map<string, Promise<any>>();

const RealTimeSiqsFetcher: React.FC<RealTimeSiqsFetcherProps> = ({
  isVisible,
  showRealTimeSiqs,
  latitude,
  longitude,
  bortleScale = 5,
  onSiqsCalculated,
  forceUpdate = false
}) => {
  const [loading, setLoading] = useState(false);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number>(0);
  const mountedRef = useRef(true);
  
  // Reset timer when component unmounts
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    if (!showRealTimeSiqs || !isVisible || !latitude || !longitude) {
      return;
    }
    
    if (forceUpdate) {
      // Clear cache for this location when force update is requested
      const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${bortleScale}`;
      siqsResultCache.delete(cacheKey);
      pendingCalculations.delete(cacheKey);
      console.log("Force updating SIQS data for:", cacheKey);
    }
    
    const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}-${bortleScale}`;
    const now = Date.now();
    
    // Check memory cache first (fastest)
    const memoCached = siqsResultCache.get(cacheKey);
    if (memoCached && (now - memoCached.timestamp) < CACHE_DURATION && !forceUpdate) {
      console.log("Using in-memory cached SIQS");
      onSiqsCalculated(memoCached.siqs, false, memoCached.confidence);
      return;
    }
    
    // Then check persistent cache
    if (hasCachedSiqs(latitude, longitude) && !forceUpdate) {
      const cachedData = getCachedSiqs(latitude, longitude);
      if (cachedData && (now - new Date(cachedData.metadata?.calculatedAt || 0).getTime()) < CACHE_DURATION) {
        console.log("Using persistent cached SIQS");
        
        // Extract confidence score from metadata if available
        const confidence = cachedData.metadata?.reliability?.score || 8;
        
        onSiqsCalculated(cachedData.siqs, false, confidence);
        
        // Update memory cache
        siqsResultCache.set(cacheKey, {
          siqs: cachedData.siqs,
          confidence,
          timestamp: now
        });
        
        return;
      }
    }

    // Check if we should fetch fresh data
    const shouldFetch = forceUpdate || now - lastFetchTimestamp > 30000; // Don't fetch too often
    
    if (shouldFetch) {
      console.log(`Fetching real-time SIQS for location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      
      // Check if a calculation is already pending for these coordinates
      if (pendingCalculations.has(cacheKey) && !forceUpdate) {
        console.log("Reusing pending SIQS calculation");
        setLoading(true);
        onSiqsCalculated(null, true);
        
        // Reuse the existing promise
        pendingCalculations.get(cacheKey)!
          .then((result) => {
            if (!mountedRef.current) return;
            
            if (result && result.siqs > 0) {
              const confidence = result.metadata?.reliability?.score || 8;
              onSiqsCalculated(result.siqs, false, confidence);
              
              // Update cache
              siqsResultCache.set(cacheKey, {
                siqs: result.siqs,
                confidence,
                timestamp: Date.now()
              });
              
              // Also update persistent cache
              setSiqsCache(latitude, longitude, result);
            }
          })
          .catch((error) => {
            if (!mountedRef.current) return;
            console.error("Error in pending SIQS calculation:", error);
            onSiqsCalculated(null, false);
          })
          .finally(() => {
            if (mountedRef.current) {
              setLoading(false);
            }
          });
          
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
          cacheDurationMins: 10,
          includeMetadata: true
        }
      ).then(result => {
        if (!mountedRef.current) return result;
        
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
            finalSiqs = correctedResult.siqs > 10 ? 
              correctedResult.siqs / 10 : correctedResult.siqs;
          } else {
            finalSiqs = correctedResult.siqs > 10 ? 
              correctedResult.siqs / 10 : correctedResult.siqs;
            finalSiqs *= (reliability.confidenceScore / 10);
          }
          
          // Ensure SIQS is in the correct scale (0-10)
          finalSiqs = finalSiqs > 10 ? finalSiqs / 10 : finalSiqs;
          finalSiqs = Math.min(Math.max(finalSiqs, 0), 10);
          
          // Update persistent cache
          const enhancedResult = {
            ...correctedResult,
            siqs: finalSiqs,
            metadata: {
              ...correctedResult.metadata,
              calculatedAt: new Date().toISOString(),
              reliability: {
                score: reliability.confidenceScore,
                issues: reliability.issues
              }
            }
          };
          
          setSiqsCache(latitude, longitude, enhancedResult);
          
          // Update memory cache
          siqsResultCache.set(cacheKey, {
            siqs: finalSiqs,
            confidence: reliability.confidenceScore,
            timestamp: Date.now()
          });
          
          onSiqsCalculated(finalSiqs, false, reliability.confidenceScore);
          return enhancedResult;
        }
        
        onSiqsCalculated(0, false);
        return result;
      }).catch(error => {
        if (!mountedRef.current) return null;
        console.error("Error fetching real-time SIQS:", error);
        onSiqsCalculated(null, false);
        throw error;
      }).finally(() => {
        if (mountedRef.current) {
          setLoading(false);
          setLastFetchTimestamp(now);
        }
        pendingCalculations.delete(cacheKey);
      });
      
      // Store the promise to allow other components to reuse it
      pendingCalculations.set(cacheKey, calculationPromise);
    }
  }, [latitude, longitude, showRealTimeSiqs, isVisible, bortleScale, onSiqsCalculated, lastFetchTimestamp, forceUpdate]);

  return null;
};

export default React.memo(RealTimeSiqsFetcher);

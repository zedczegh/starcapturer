
import React, { useState, useEffect } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { calculateAstronomicalNight, formatTime } from '@/utils/astronomy/nightTimeCalculator';
import { hasCachedSiqs, getCachedSiqs } from '@/services/realTimeSiqs/siqsCache';
import { detectAndFixAnomalies, assessDataReliability } from '@/services/realTimeSiqs/siqsAnomalyDetector';

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
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for fresher data
  
  useEffect(() => {
    if (showRealTimeSiqs && isVisible && latitude && longitude) {
      const now = Date.now();
      
      // Check enhanced cache system first
      if (hasCachedSiqs(latitude, longitude)) {
        const cachedData = getCachedSiqs(latitude, longitude);
        if (cachedData) {
          onSiqsCalculated(cachedData.siqs, false);
          return;
        }
      }
      
      const shouldFetch = now - lastFetchTimestamp > CACHE_DURATION;
      
      if (shouldFetch) {
        console.log(`Fetching real-time SIQS for location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        
        const fetchSiqs = async () => {
          setLoading(true);
          onSiqsCalculated(null, true);
          
          try {
            const effectiveBortleScale = bortleScale || (showRealTimeSiqs ? 3 : 5);
            
            // Calculate astronomical night for this location
            const { start, end } = calculateAstronomicalNight(latitude, longitude);
            console.log(`Astronomical night: ${formatTime(start)}-${formatTime(end)}`);
            
            // Calculate SIQS
            const result = await calculateRealTimeSiqs(latitude, longitude, effectiveBortleScale);
            
            if (result && result.siqs > 0) {
              // Apply anomaly detection and correction
              const correctedResult = detectAndFixAnomalies(
                result,
                { ...result.weatherData, latitude, longitude },
                { latitude, longitude }
              );
              
              // Assess data reliability
              const reliability = assessDataReliability(result.weatherData, result.forecastData);
              
              if (reliability.reliable) {
                console.log(`Calculated SIQS (corrected): ${correctedResult.siqs}`);
                onSiqsCalculated(correctedResult.siqs, false);
              } else {
                console.warn(`Low reliability SIQS calculation:`, reliability.issues);
                onSiqsCalculated(correctedResult.siqs * (reliability.confidenceScore / 10), false);
              }
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

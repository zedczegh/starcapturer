import React, { useState, useEffect } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { calculateAstronomicalNight, formatTime } from '@/utils/astronomy/nightTimeCalculator';
import { hasCachedSiqs, getCachedSiqs } from '@/services/realTimeSiqs/siqsCache';
import { detectAndFixAnomalies, assessDataReliability } from '@/services/realTimeSiqs/siqsAnomalyDetector';
import { WeatherDataWithClearSky } from '@/services/realTimeSiqs/siqsTypes';
import { calculateTonightCloudCover } from '@/utils/nighttimeSIQS';

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
      const cacheKey = `${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
      
      if (hasCachedSiqs(latitude, longitude)) {
        const cachedData = getCachedSiqs(latitude, longitude);
        if (cachedData && (now - new Date(cachedData.metadata?.calculatedAt || 0).getTime()) < CACHE_DURATION) {
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
            
            const result = await calculateRealTimeSiqs(
              latitude, 
              longitude, 
              effectiveBortleScale,
              {
                useSingleHourSampling: true,
                targetHour: 1,
                cacheDurationMins: 5
              }
            );
            
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
              
              if (reliability.reliable) {
                console.log(`Calculated SIQS (corrected): ${correctedResult.siqs}`);
                onSiqsCalculated(correctedResult.siqs, false);
              } else {
                console.warn(`Low reliability SIQS calculation:`, reliability.issues);
                const finalSiqs = correctedResult.siqs > 10 ? 
                  correctedResult.siqs / 10 : correctedResult.siqs;
                onSiqsCalculated(finalSiqs * (reliability.confidenceScore / 10), false);
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
  }, [latitude, longitude, showRealTimeSiqs, isVisible, bortleScale, onSiqsCalculated]);

  return null;
};

export default RealTimeSiqsFetcher;

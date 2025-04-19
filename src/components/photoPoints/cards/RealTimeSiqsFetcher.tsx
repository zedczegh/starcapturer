
import React, { useState, useEffect } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqs/siqsCalculator';
import { calculateAstronomicalNight, formatTime } from '@/utils/astronomy/nightTimeCalculator';
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
    // Only fetch SIQS if component is visible, real-time SIQS is enabled, and coordinates are valid
    if (showRealTimeSiqs && isVisible && latitude && longitude) {
      const now = Date.now();
      
      // Check if we should fetch based on cache duration
      const shouldFetch = now - lastFetchTimestamp > CACHE_DURATION;
      
      if (shouldFetch) {
        console.log(`Fetching real-time SIQS for location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        
        const fetchSiqs = async () => {
          try {
            setLoading(true);
            onSiqsCalculated(null, true);
            
            const effectiveBortleScale = bortleScale || 5;
            
            // Calculate SIQS with error handling
            const result = await calculateRealTimeSiqs(latitude, longitude, effectiveBortleScale);
            
            // Always set loading to false in finally block
            if (result && result.siqs > 0) {
              console.log(`Calculated SIQS: ${result.siqs}`);
              onSiqsCalculated(result.siqs, false);
            } else {
              console.log("No valid SIQS result returned");
              onSiqsCalculated(null, false);
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

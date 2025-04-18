
import React, { useState, useEffect, useRef } from 'react';
import { calculateRealTimeSiqs } from '@/services/realTimeSiqsService';

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
  const CACHE_DURATION = 10 * 60 * 1000; // Increased to 10 minutes cache to reduce API calls
  const fetchingRef = useRef(false); // Use ref to prevent concurrent fetches
  
  useEffect(() => {
    if (showRealTimeSiqs && isVisible && latitude && longitude) {
      const now = Date.now();
      const shouldFetch = now - lastFetchTimestamp > CACHE_DURATION && !fetchingRef.current;
      
      if (shouldFetch) {
        console.log(`Fetching cloud cover-based SIQS for location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        const fetchSiqs = async () => {
          setLoading(true);
          onSiqsCalculated(null, true);
          fetchingRef.current = true;
          
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
                
                // Only update if SIQS score is high quality (>= 5.0)
                if (data.score >= 5.0) {
                  onSiqsCalculated(data.score, false);
                } else {
                  console.log(`Skipping low quality location (SIQS: ${data.score.toFixed(1)})`);
                  onSiqsCalculated(null, false);
                }
                
                setLoading(false);
                fetchingRef.current = false;
                return;
              }
            }
            
            // Calculate fresh data based on nighttime cloud cover
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
              
              const cloudCover = result.factors?.[0]?.description?.match(/\d+/)?.[0] || 'unknown';
              console.log(`Cloud cover-based SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}: ${result.score.toFixed(1)} (cloud cover: ${cloudCover}%)`);
              
              // Only update if SIQS score is high quality (>= 5.0)
              if (result.score >= 5.0) {
                onSiqsCalculated(result.score, false);
              } else {
                console.log(`Skipping low quality location (SIQS: ${result.score.toFixed(1)})`);
                onSiqsCalculated(null, false);
              }
            } else {
              onSiqsCalculated(null, false);
            }
          } catch (error) {
            console.error("Error fetching SIQS data:", error);
            onSiqsCalculated(null, false);
          }
          
          setLoading(false);
          setLastFetchTimestamp(now);
          fetchingRef.current = false;
        };
        
        fetchSiqs();
      }
    }
  }, [isVisible, showRealTimeSiqs, latitude, longitude, bortleScale, lastFetchTimestamp, onSiqsCalculated]);
  
  return null; // This component doesn't render anything
};

export default RealTimeSiqsFetcher;

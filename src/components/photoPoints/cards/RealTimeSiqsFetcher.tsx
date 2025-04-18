
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
  const [lastCoordinates, setLastCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const CACHE_DURATION = 30 * 60 * 1000; // Increased to 30 minutes cache to reduce API calls
  const fetchingRef = useRef(false); // Use ref to prevent concurrent fetches
  
  // Determine if this is a new location that requires calculation
  const isNewLocation = (lat?: number, lng?: number): boolean => {
    if (!lat || !lng || !lastCoordinates) return true;
    
    // Check if coordinates have changed significantly (at least 0.01 degrees, ~1km)
    const latDiff = Math.abs(lat - lastCoordinates.lat);
    const lngDiff = Math.abs(lng - lastCoordinates.lng);
    
    return latDiff > 0.01 || lngDiff > 0.01;
  };
  
  useEffect(() => {
    if (showRealTimeSiqs && isVisible && latitude && longitude) {
      const now = Date.now();
      const needsFetch = isNewLocation(latitude, longitude);
      const cacheExpired = now - lastFetchTimestamp > CACHE_DURATION;
      const shouldFetch = (needsFetch || cacheExpired) && !fetchingRef.current;
      
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
                
                // Update last coordinates to prevent unnecessary recalculations
                setLastCoordinates({ lat: latitude, lng: longitude });
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
              
              // Update last coordinates to prevent unnecessary recalculations
              setLastCoordinates({ lat: latitude, lng: longitude });
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
  }, [isVisible, showRealTimeSiqs, latitude, longitude, bortleScale, onSiqsCalculated]);
  
  return null; // This component doesn't render anything
};

export default RealTimeSiqsFetcher;

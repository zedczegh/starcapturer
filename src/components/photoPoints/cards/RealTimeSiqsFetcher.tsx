
import React, { useState, useEffect } from 'react';
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
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  
  useEffect(() => {
    if (showRealTimeSiqs && isVisible && latitude && longitude) {
      // Check if we should fetch or use cache
      const now = Date.now();
      const shouldFetch = now - lastFetchTimestamp > CACHE_DURATION;
      
      if (shouldFetch) {
        console.log(`Fetching real-time SIQS for location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        const fetchSiqs = async () => {
          setLoading(true);
          onSiqsCalculated(null, true); // Signal loading state to parent
          
          try {
            // Ensure we're using a valid Bortle scale for calculation
            // Dark sky certified locations typically have better Bortle scores
            const effectiveBortleScale = bortleScale || 
              (showRealTimeSiqs ? 3 : 5); // Default to better Bortle for certified locations
            
            const result = await calculateRealTimeSiqs(
              latitude,
              longitude,
              effectiveBortleScale
            );
            
            if (result && result.siqs > 0) {
              console.log(`Calculated SIQS for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}: ${result.siqs}`);
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
  
  return null; // This is a logic-only component
};

export default RealTimeSiqsFetcher;

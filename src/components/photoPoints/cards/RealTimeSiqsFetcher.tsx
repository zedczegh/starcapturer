
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
  
  useEffect(() => {
    if (showRealTimeSiqs && isVisible && latitude && longitude) {
      const fetchSiqs = async () => {
        setLoading(true);
        try {
          const result = await calculateRealTimeSiqs(
            latitude,
            longitude,
            bortleScale
          );
          
          if (result.siqs > 0) {
            onSiqsCalculated(result.siqs, false);
          } else {
            onSiqsCalculated(0, false);
          }
        } catch (error) {
          console.error("Error fetching real-time SIQS:", error);
          onSiqsCalculated(null, false);
        } finally {
          setLoading(false);
        }
      };
      
      fetchSiqs();
    }
  }, [latitude, longitude, showRealTimeSiqs, isVisible, bortleScale, onSiqsCalculated]);
  
  return null; // This is a logic-only component
};

export default RealTimeSiqsFetcher;

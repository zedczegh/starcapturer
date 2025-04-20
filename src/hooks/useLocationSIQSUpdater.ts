
import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook to efficiently manage SIQS updates for location data
 * This prevents redundant calculations and reduces page load time
 */
export const useLocationSIQSUpdater = (
  locationData: any,
  forecastData: any,
  setLocationData: (data: any) => void,
  t: (text: string, chinese: string) => string
) => {
  const [updateState, setUpdateState] = useState({
    lastUpdated: 0,
    latitude: 0,
    longitude: 0,
    isUpdating: false
  });
  const throttleRef = useRef<number | null>(null);
  const isMounted = useRef(true);
  
  // Helper to prevent redundant updates
  const needsUpdate = (locationData?: any, forecastData?: any): boolean => {
    if (!locationData || !forecastData) return false;
    
    // Check last update time
    const now = Date.now();
    if (now - updateState.lastUpdated < 60000) {
      return false; // Less than 1 minute since last update
    }
    
    // Check if location has changed substantially
    if (locationData.latitude && locationData.longitude) {
      const latDiff = Math.abs(locationData.latitude - updateState.latitude);
      const lonDiff = Math.abs(locationData.longitude - updateState.longitude);
      if (latDiff < 0.001 && lonDiff < 0.001 && updateState.lastUpdated > 0) {
        return false;
      }
    }
    
    return true;
  };

  const resetUpdateState = () => {
    setUpdateState({
      lastUpdated: 0,
      latitude: 0,
      longitude: 0,
      isUpdating: false
    });
  };
  
  // Cleanup
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      if (throttleRef.current !== null) {
        window.clearTimeout(throttleRef.current);
        throttleRef.current = null;
      }
    };
  }, []);

  return {
    updateState,
    setUpdateState,
    needsUpdate,
    resetUpdateState
  };
};

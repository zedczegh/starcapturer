
import { useState, useEffect, useCallback } from 'react';

interface UseRefreshManagerProps {
  locationData: any;
  interval?: number;
}

/**
 * A hook to manage refresh intervals and states for location data
 */
export function useRefreshManager({ 
  locationData, 
  interval = 60000 // Default 1 minute
}: UseRefreshManagerProps) {
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [shouldRefresh, setShouldRefresh] = useState<boolean>(true);
  
  // Check if data should be refreshed based on timestamp
  useEffect(() => {
    if (!locationData) {
      setShouldRefresh(true);
      return;
    }
    
    const now = Date.now();
    const timestamp = locationData.timestamp || 0;
    const timeSinceLastUpdate = now - timestamp;
    
    // If data is older than the refresh interval, mark for refresh
    if (timeSinceLastUpdate > interval) {
      setShouldRefresh(true);
    }
    
    // Special case: if location came from photo points or calculator
    if (locationData.fromPhotoPoints || locationData.fromCalculator) {
      setShouldRefresh(true);
    }
  }, [locationData, interval]);
  
  // Mark a refresh as complete
  const markRefreshComplete = useCallback(() => {
    setLastRefreshTime(Date.now());
    setShouldRefresh(false);
  }, []);
  
  // Force a refresh
  const forceRefresh = useCallback(() => {
    setShouldRefresh(true);
  }, []);
  
  return {
    shouldRefresh,
    lastRefreshTime,
    markRefreshComplete,
    forceRefresh
  };
}

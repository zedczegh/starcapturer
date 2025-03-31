
import { useState, useEffect, useRef } from 'react';

/**
 * Hook to manage refresh state for location data
 * Prevents multiple refreshes when navigating from PhotoPoints page
 */
export function useRefreshManager(locationData: any) {
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const refreshedRef = useRef(false);
  const locationSignatureRef = useRef<string | null>(null);
  const refreshAttemptCountRef = useRef(0);
  const lastRefreshTimeRef = useRef<number | null>(null);
  
  // Calculate a unique signature for this location
  const getLocationSignature = () => {
    if (!locationData) return null;
    return `${locationData.latitude?.toFixed(4)}-${locationData.longitude?.toFixed(4)}`;
  };
  
  // Check if enough time has passed since last refresh (3 seconds)
  const canRefreshAgain = () => {
    if (!lastRefreshTimeRef.current) return true;
    const timeElapsed = Date.now() - lastRefreshTimeRef.current;
    return timeElapsed > 3000; // Minimum 3 seconds between refreshes
  };
  
  // Reset refresh state when location changes
  useEffect(() => {
    const currentSignature = getLocationSignature();
    
    // Only refresh if:
    // 1. Location has changed significantly
    // 2. Coming from PhotoPoints page (but limit frequency)
    // 3. First load of this location
    if (
      // Location has changed
      (currentSignature && currentSignature !== locationSignatureRef.current) ||
      // Coming from PhotoPoints page (only refresh once)
      (locationData?.fromPhotoPoints === true && !refreshedRef.current && canRefreshAgain())
    ) {
      console.log("Refresh state reset due to location change or PhotoPoints navigation");
      locationSignatureRef.current = currentSignature;
      
      // Increment refresh attempt counter
      refreshAttemptCountRef.current += 1;
      
      // Only allow refresh if we haven't attempted too many times
      if (refreshAttemptCountRef.current <= 2) {
        setShouldRefresh(true);
        lastRefreshTimeRef.current = Date.now();
      } else {
        console.log("Too many refresh attempts, skipping refresh");
        
        // Reset counter after a cool-down period
        setTimeout(() => {
          refreshAttemptCountRef.current = 0;
        }, 10000);
      }
    }
  }, [locationData]);
  
  // Function to mark refresh as complete
  const markRefreshComplete = () => {
    refreshedRef.current = true;
    setShouldRefresh(false);
    
    // Reset refresh attempt counter after successful refresh
    refreshAttemptCountRef.current = 0;
  };
  
  return {
    shouldRefresh,
    markRefreshComplete
  };
}

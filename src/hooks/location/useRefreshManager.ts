
import { useState, useEffect, useRef } from 'react';

/**
 * Hook to manage refresh state for location data
 * Prevents multiple refreshes when navigating from PhotoPoints page
 * Fixed to prevent refresh bugs in location details
 */
export function useRefreshManager(locationData: any) {
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const refreshedRef = useRef(false);
  const locationSignatureRef = useRef<string | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  
  // Calculate a unique signature for this location
  const getLocationSignature = () => {
    if (!locationData) return null;
    return `${locationData.latitude?.toFixed(6)}-${locationData.longitude?.toFixed(6)}`;
  };
  
  // Reset refresh state when location changes
  useEffect(() => {
    const currentSignature = getLocationSignature();
    const currentTime = Date.now();
    const timeSinceLastRefresh = currentTime - lastRefreshTimeRef.current;
    
    // Prevent refresh spamming - only allow refresh every 2 seconds
    const preventRefreshSpamming = timeSinceLastRefresh < 2000;
    
    // Check if location has changed or if coming from PhotoPoints
    if (
      // Location has changed significantly
      (currentSignature && currentSignature !== locationSignatureRef.current) ||
      // Coming from PhotoPoints page
      (locationData?.fromPhotoPoints === true) ||
      // First load of this location
      (currentSignature && !refreshedRef.current)
    ) {
      if (!preventRefreshSpamming) {
        console.log("Refresh state reset due to location change or PhotoPoints navigation");
        locationSignatureRef.current = currentSignature;
        lastRefreshTimeRef.current = currentTime;
        setShouldRefresh(true);
      } else {
        console.log("Refresh prevented due to throttling (refresh requested too soon)");
      }
    }
  }, [locationData]);
  
  // Function to mark refresh as complete
  const markRefreshComplete = () => {
    refreshedRef.current = true;
    setShouldRefresh(false);
  };
  
  return {
    shouldRefresh,
    markRefreshComplete
  };
}

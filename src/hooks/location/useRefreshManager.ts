
import { useState, useEffect, useRef } from 'react';

/**
 * Hook to manage refresh state for location data
 * Prevents multiple refreshes when navigating between pages
 * Fixed to limit refreshes to once per page load
 */
export function useRefreshManager(locationData: any) {
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const hasRefreshedRef = useRef(false);
  const locationSignatureRef = useRef<string | null>(null);
  
  // Calculate a unique signature for this location
  const getLocationSignature = () => {
    if (!locationData) return null;
    return `${locationData.latitude?.toFixed(6)}-${locationData.longitude?.toFixed(6)}`;
  };
  
  // Reset refresh state when location changes or component mounts
  useEffect(() => {
    const currentSignature = getLocationSignature();
    
    // Only refresh once per component mount/location
    if (currentSignature && !hasRefreshedRef.current) {
      console.log("First visit to this location, triggering single refresh");
      setShouldRefresh(true);
      hasRefreshedRef.current = true;
    } else {
      console.log("Location already refreshed or unchanged, skipping automatic refresh");
    }
    
    // Reset the refresh state when component unmounts
    return () => {
      // We don't reset hasRefreshedRef here to maintain the "once per mount" behavior
    };
  }, [locationData]);
  
  // Function to mark refresh as complete
  const markRefreshComplete = () => {
    setShouldRefresh(false);
  };
  
  // Function to manually trigger a refresh when needed
  const triggerManualRefresh = () => {
    console.log("Manual refresh triggered");
    setShouldRefresh(true);
  };
  
  return {
    shouldRefresh,
    markRefreshComplete,
    triggerManualRefresh
  };
}

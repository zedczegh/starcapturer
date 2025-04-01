
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
  const pageVisitCountRef = useRef<number>(0);
  
  // Calculate a unique signature for this location
  const getLocationSignature = () => {
    if (!locationData) return null;
    return `${locationData.latitude?.toFixed(6)}-${locationData.longitude?.toFixed(6)}`;
  };
  
  // Reset refresh state when location changes or once per page visit
  useEffect(() => {
    const currentSignature = getLocationSignature();
    
    // Increment page visit counter for this location
    if (currentSignature && currentSignature !== locationSignatureRef.current) {
      pageVisitCountRef.current = 1;
      locationSignatureRef.current = currentSignature;
    }
    
    // Only refresh on first visit to this location
    if (currentSignature && !hasRefreshedRef.current) {
      console.log("First visit to this location, triggering single refresh");
      setShouldRefresh(true);
      hasRefreshedRef.current = true;
    } else {
      console.log("Location already refreshed, skipping automatic refresh");
    }
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


import { useState, useEffect, useRef } from 'react';

/**
 * Hook to manage refresh state for location data
 * Ensures only one refresh when the location details page is opened
 */
export function useRefreshManager(locationData: any) {
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const refreshedRef = useRef(false);
  const locationSignatureRef = useRef<string | null>(null);
  const pageLoadRefreshedRef = useRef(false);
  
  // Calculate a unique signature for this location
  const getLocationSignature = () => {
    if (!locationData) return null;
    return `${locationData.latitude?.toFixed(6)}-${locationData.longitude?.toFixed(6)}`;
  };
  
  // Reset refresh state when location changes or on first page load
  useEffect(() => {
    const currentSignature = getLocationSignature();
    
    // Check for location change or first load
    if (
      // First page load for any location
      !pageLoadRefreshedRef.current ||
      // Location has changed significantly
      (currentSignature && currentSignature !== locationSignatureRef.current) ||
      // Coming from PhotoPoints page (special case)
      (locationData?.fromPhotoPoints === true)
    ) {
      console.log("Refresh triggered: new location or initial page load");
      locationSignatureRef.current = currentSignature;
      setShouldRefresh(true);
      pageLoadRefreshedRef.current = true;
    }
  }, [locationData]);
  
  // Function to mark refresh as complete
  const markRefreshComplete = () => {
    refreshedRef.current = true;
    setShouldRefresh(false);
  };
  
  // Function to reset page load refresh flag (for testing purposes)
  const resetPageLoadFlag = () => {
    pageLoadRefreshedRef.current = false;
  };
  
  return {
    shouldRefresh,
    markRefreshComplete,
    resetPageLoadFlag
  };
}

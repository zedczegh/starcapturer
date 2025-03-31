
import { useState, useEffect, useRef } from 'react';

/**
 * Hook to manage refresh state for location data
 * Prevents multiple refreshes when navigating from PhotoPoints page
 */
export function useRefreshManager(locationData: any) {
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const refreshedRef = useRef(false);
  const locationSignatureRef = useRef<string | null>(null);
  
  // Calculate a unique signature for this location
  const getLocationSignature = () => {
    if (!locationData) return null;
    return `${locationData.latitude?.toFixed(4)}-${locationData.longitude?.toFixed(4)}`;
  };
  
  // Reset refresh state when location changes
  useEffect(() => {
    const currentSignature = getLocationSignature();
    
    // Check if location has changed or if coming from PhotoPoints
    if (
      // Location has changed
      (currentSignature && currentSignature !== locationSignatureRef.current) ||
      // Coming from PhotoPoints page
      (locationData?.fromPhotoPoints === true) ||
      // First load of this location
      (currentSignature && !refreshedRef.current)
    ) {
      console.log("Refresh state reset due to location change or PhotoPoints navigation");
      locationSignatureRef.current = currentSignature;
      setShouldRefresh(true);
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

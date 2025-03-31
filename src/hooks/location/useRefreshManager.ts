
import { useState, useEffect, useRef } from 'react';

// Minimum wait time between refreshes (in ms)
const MIN_REFRESH_INTERVAL = 8000; // 8 seconds
// Maximum number of auto-refreshes 
const MAX_AUTO_REFRESHES = 1;
// Cooldown period for refresh management (in ms)
const REFRESH_COOLDOWN = 120000; // 2 minutes

/**
 * Hook to manage refresh state for location data
 * Prevents multiple refreshes when navigating and optimizes performance
 */
export function useRefreshManager(locationData: any) {
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const refreshedRef = useRef(false);
  const locationSignatureRef = useRef<string | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshCountRef = useRef<number>(0);
  const refreshTimeoutRef = useRef<number | null>(null);
  const refreshCooldownTimeoutRef = useRef<number | null>(null);
  const isInCooldownRef = useRef<boolean>(false);
  
  // Calculate a unique signature for this location
  const getLocationSignature = () => {
    if (!locationData) return null;
    return `${locationData.latitude?.toFixed(6)}-${locationData.longitude?.toFixed(6)}`;
  };
  
  // Manage refresh state when location changes
  useEffect(() => {
    const currentSignature = getLocationSignature();
    const currentTime = Date.now();
    const timeSinceLastRefresh = currentTime - lastRefreshTimeRef.current;
    
    // Prevent refresh spamming - only allow refresh at specific intervals
    const preventRefreshSpamming = timeSinceLastRefresh < MIN_REFRESH_INTERVAL;
    
    // Check if we're in cooldown period
    if (isInCooldownRef.current) {
      console.log("Refresh skipped due to cooldown period");
      return;
    }
    
    // Check if we need to refresh
    const shouldAttemptRefresh = (
      // Location has changed significantly
      (currentSignature && currentSignature !== locationSignatureRef.current) ||
      // Coming from PhotoPoints page and under the max refresh count
      (locationData?.fromPhotoPoints === true && refreshCountRef.current < MAX_AUTO_REFRESHES) ||
      // First load of this location
      (currentSignature && !refreshedRef.current)
    );
    
    // Clear any existing timeout
    if (refreshTimeoutRef.current !== null) {
      window.clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    if (shouldAttemptRefresh) {
      if (!preventRefreshSpamming) {
        console.log("Refresh state reset due to location change or PhotoPoints navigation");
        locationSignatureRef.current = currentSignature;
        lastRefreshTimeRef.current = currentTime;
        refreshCountRef.current += 1;
        setShouldRefresh(true);
        
        // Set cooldown period after a refresh
        isInCooldownRef.current = true;
        refreshCooldownTimeoutRef.current = window.setTimeout(() => {
          isInCooldownRef.current = false;
          refreshCooldownTimeoutRef.current = null;
          console.log("Refresh cooldown period ended");
        }, REFRESH_COOLDOWN);
      } else {
        // Schedule a delayed refresh if we're throttling
        console.log("Refresh scheduled due to throttling (refresh requested too soon)");
        refreshTimeoutRef.current = window.setTimeout(() => {
          locationSignatureRef.current = currentSignature;
          lastRefreshTimeRef.current = Date.now();
          refreshCountRef.current += 1;
          setShouldRefresh(true);
          refreshTimeoutRef.current = null;
          
          // Set cooldown period
          isInCooldownRef.current = true;
          refreshCooldownTimeoutRef.current = window.setTimeout(() => {
            isInCooldownRef.current = false;
            refreshCooldownTimeoutRef.current = null;
          }, REFRESH_COOLDOWN);
        }, MIN_REFRESH_INTERVAL - timeSinceLastRefresh);
      }
    }
    
    // Cleanup function
    return () => {
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
      if (refreshCooldownTimeoutRef.current !== null) {
        window.clearTimeout(refreshCooldownTimeoutRef.current);
      }
    };
  }, [locationData]);
  
  // Function to mark refresh as complete
  const markRefreshComplete = () => {
    refreshedRef.current = true;
    setShouldRefresh(false);
  };
  
  // Reset function to force a refresh
  const forceRefresh = () => {
    if (isInCooldownRef.current) {
      console.log("Force refresh attempted but still in cooldown period");
      return false;
    }
    
    console.log("Force refresh initiated");
    refreshedRef.current = false;
    refreshCountRef.current = 0;
    locationSignatureRef.current = null;
    lastRefreshTimeRef.current = 0;
    setShouldRefresh(true);
    return true;
  };
  
  return {
    shouldRefresh,
    markRefreshComplete,
    forceRefresh
  };
}

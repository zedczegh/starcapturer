
import { useEffect, useState, useRef } from "react";
import { usePhotoPointsNavigation } from "./usePhotoPointsNavigation";
import { getLastRefreshTimestamp, saveRefreshTimestamp } from "@/utils/locationStorage";

/**
 * Custom hook to manage refresh logic for location details page
 * Controls when the page should refresh data based on navigation source
 */
export function useRefreshManager(locationData: any) {
  const [shouldRefresh, setShouldRefresh] = useState<boolean>(false);
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const refreshTimeoutRef = useRef<number | null>(null);
  const refreshingRef = useRef<boolean>(false);
  
  // Get the locationId from the data
  const locationId = locationData?.id;
  
  // Use the navigation hook to detect if we came from photo points
  const { needsRefresh } = usePhotoPointsNavigation(locationId);
  
  // Initial check for refresh conditions with improved error handling
  useEffect(() => {
    // Skip if already refreshing
    if (refreshingRef.current || !locationData) return;
    
    try {
      // Determine if we should refresh based on different scenarios
      const fromPhotoPoints = locationData?.fromPhotoPoints === true;
      const fromCalculator = locationData?.fromCalculator === true;
      const noSiqsData = !locationData?.siqsResult?.score || 
                        locationData?.siqsResult?.score === 0;
      
      // If we're coming from photo points or calculator AND we already have data, don't refresh
      const hasRequiredData = Boolean(locationData?.weatherData && locationData?.siqsResult?.score > 0);
      const isRedirectWithData = (fromPhotoPoints || fromCalculator) && hasRequiredData;
      
      // Check if enough time has passed since last refresh (15 minutes)
      let needsTimeBasedRefresh = false;
      if (locationId) {
        const lastRefresh = getLastRefreshTimestamp(locationId);
        if (!lastRefresh) {
          needsTimeBasedRefresh = true;
        } else {
          const lastRefreshTime = new Date(lastRefresh).getTime();
          const currentTime = new Date().getTime();
          needsTimeBasedRefresh = (currentTime - lastRefreshTime) > (15 * 60 * 1000);
        }
      }
      
      // Only trigger refresh if not a redirect with data or if explicitly needed
      const shouldTriggerRefresh = (!isRedirectWithData && (noSiqsData || needsRefresh || needsTimeBasedRefresh || refreshCount === 0));
      
      if (shouldTriggerRefresh) {
        console.log("Setting refresh flag based on conditions:", {
          fromPhotoPoints,
          fromCalculator,
          noSiqsData,
          needsRefresh,
          refreshCount,
          hasRequiredData,
          needsTimeBasedRefresh
        });
        
        refreshingRef.current = true;
        
        // Clear any existing timeout
        if (refreshTimeoutRef.current) {
          window.clearTimeout(refreshTimeoutRef.current);
        }
        
        // Set a short delay to prevent multiple simultaneous refreshes
        refreshTimeoutRef.current = window.setTimeout(() => {
          setShouldRefresh(true);
          refreshTimeoutRef.current = null;
        }, 300);
      } else if (isRedirectWithData) {
        console.log("Skipping refresh because we have redirect with existing data");
        setShouldRefresh(false);
      }
    } catch (error) {
      console.error("Error in useRefreshManager:", error);
      setShouldRefresh(false);
      refreshingRef.current = false;
    }
    
    return () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [locationData, needsRefresh, refreshCount, locationId]);
  
  // Function to mark refresh as complete
  const markRefreshComplete = () => {
    setShouldRefresh(false);
    setRefreshCount(prev => prev + 1);
    refreshingRef.current = false;
    
    // Update refresh timestamp
    if (locationId) {
      saveRefreshTimestamp(locationId);
    }
    
    // Log instead of toast
    console.log("Location data refreshed successfully");
  };
  
  return {
    shouldRefresh,
    markRefreshComplete,
    // Expose the refresh count for debugging
    refreshCount
  };
}


import { useEffect, useState } from "react";
import { usePhotoPointsNavigation } from "./usePhotoPointsNavigation";

/**
 * Custom hook to manage refresh logic for location details page
 * Controls when the page should refresh data based on navigation source
 */
export function useRefreshManager(locationData: any) {
  const [shouldRefresh, setShouldRefresh] = useState<boolean>(false);
  const [refreshCount, setRefreshCount] = useState<number>(0);
  
  // Get the locationId from the data
  const locationId = locationData?.id;
  
  // Use the navigation hook to detect if we came from photo points
  const { needsRefresh } = usePhotoPointsNavigation(locationId);
  
  // Initial check for refresh conditions
  useEffect(() => {
    // Determine if we should refresh based on different scenarios
    const fromPhotoPoints = locationData?.fromPhotoPoints === true;
    const fromCalculator = locationData?.fromCalculator === true;
    const noSiqsData = !locationData?.siqsResult?.score || 
                       locationData?.siqsResult?.score === 0;
    
    // If we're coming from photo points or calculator AND we already have data, don't refresh
    const hasRequiredData = Boolean(locationData?.weatherData && locationData?.siqsResult?.score > 0);
    const isRedirectWithData = (fromPhotoPoints || fromCalculator) && hasRequiredData;
    
    // Only trigger refresh if not a redirect with data or if explicitly needed
    const shouldTriggerRefresh = (!isRedirectWithData && (noSiqsData || needsRefresh || refreshCount === 0));
    
    if (shouldTriggerRefresh) {
      console.log("Setting refresh flag based on conditions:", {
        fromPhotoPoints,
        fromCalculator,
        noSiqsData,
        needsRefresh,
        refreshCount,
        hasRequiredData
      });
      setShouldRefresh(true);
    } else if (isRedirectWithData) {
      console.log("Skipping refresh because we have redirect with existing data");
      setShouldRefresh(false);
    }
  }, [locationData, needsRefresh, refreshCount]);
  
  // Function to mark refresh as complete
  const markRefreshComplete = () => {
    setShouldRefresh(false);
    setRefreshCount(prev => prev + 1);
    
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

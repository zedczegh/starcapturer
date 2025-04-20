
import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { saveLocationFromPhotoPoints, getLocationDetailsById, saveLocationDetails } from "@/utils/locationStorage";

interface PhotoPointsNavigationState {
  needsRefresh: boolean;
  markRefreshComplete: () => void;
}

/**
 * Hook to handle navigation from PhotoPoints page to location details
 * Ensures proper refresh handling and prevents infinite refresh loops
 */
export function usePhotoPointsNavigation(locationId: string | undefined): PhotoPointsNavigationState {
  const location = useLocation();
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const refreshHandledRef = useRef(false);
  const locationStateRef = useRef(location.state);
  
  // Process navigation from PhotoPoints
  useEffect(() => {
    // Skip if no locationId or already processed
    if (!locationId || refreshHandledRef.current) {
      return;
    }
    
    // Check if we're coming from PhotoPoints page
    const fromPhotoPoints = location.state?.fromPhotoPoints === true;
    const fromCalculator = location.state?.fromCalculator === true;
    
    if (fromPhotoPoints || fromCalculator) {
      console.log(`Detected navigation from ${fromPhotoPoints ? 'PhotoPoints' : 'Calculator'} page with ID:`, locationId);
      
      try {
        processPhotoPointsNavigation(locationId, location.state);
        
        // Ensure we only process once per navigation
        refreshHandledRef.current = true;
      } catch (error) {
        console.error(`Error processing ${fromPhotoPoints ? 'PhotoPoints' : 'Calculator'} navigation:`, error);
      }
    }
  }, [locationId]);
  
  // Helper function to process the navigation
  const processPhotoPointsNavigation = (id: string, navigationState: any) => {
    // Check if we have state passed from navigation first
    if (navigationState) {
      console.log("Processing navigation with state data:", navigationState);
      
      // Ensure navigation state is fully saved to localStorage
      try {
        // Save the full state for retrieval if needed
        saveLocationDetails(id, navigationState);
        console.log("Navigation state saved to localStorage");
        
        // Set flag to trigger refresh if needed
        if (!navigationState.siqsResult || !navigationState.weatherData) {
          setNeedsRefresh(true);
        }
      } catch (e) {
        console.error("Error saving navigation state:", e);
        setNeedsRefresh(true);
      }
      return;
    }
    
    // Fall back to existing location data if no state
    const existingData = getLocationDetailsById(id);
    
    if (existingData) {
      // Update the data with navigation flags
      const updatedData = {
        ...existingData,
        fromPhotoPoints: true
      };
      
      // Save to localStorage
      saveLocationFromPhotoPoints(updatedData);
      
      // Indicate that a refresh is needed
      setNeedsRefresh(true);
    } else {
      console.warn(`No existing location data found for ID: ${id}`);
      setNeedsRefresh(true);
    }
  };
  
  // Function to mark refresh as complete
  const markRefreshComplete = useCallback(() => {
    refreshHandledRef.current = true;
    setNeedsRefresh(false);
  }, []);
  
  return { 
    needsRefresh,
    markRefreshComplete
  };
}

export default usePhotoPointsNavigation;

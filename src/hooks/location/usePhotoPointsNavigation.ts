
import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { saveLocationFromPhotoPoints, getLocationDetailsById } from "@/utils/locationStorage";

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
  
  // Process navigation from PhotoPoints
  useEffect(() => {
    // Skip if no locationId or already processed
    if (!locationId || refreshHandledRef.current) {
      return;
    }
    
    // Check if we're coming from PhotoPoints page
    const fromPhotoPoints = location.state?.fromPhotoPoints === true;
    
    if (fromPhotoPoints) {
      console.log("Detected navigation from PhotoPoints page with ID:", locationId);
      refreshHandledRef.current = true;
      
      try {
        processPhotoPointsNavigation(locationId);
      } catch (error) {
        console.error("Error processing PhotoPoints navigation:", error);
      }
    }
  }, [location.state, locationId]);
  
  // Helper function to process the navigation from PhotoPoints
  const processPhotoPointsNavigation = (id: string) => {
    // Get existing location data
    const existingData = getLocationDetailsById(id);
    
    if (existingData) {
      // Update the data with the fromPhotoPoints flag
      const updatedData = {
        ...existingData,
        fromPhotoPoints: true
      };
      
      // Save to localStorage
      saveLocationFromPhotoPoints(updatedData);
      
      // Indicate that a refresh is needed
      setNeedsRefresh(true);
      
      // Log instead of toast
      console.log("Refreshing location data");
    } else {
      console.warn(`No existing location data found for ID: ${id}`);
    }
  };
  
  // Function to mark refresh as complete
  const markRefreshComplete = () => {
    refreshHandledRef.current = true;
    setNeedsRefresh(false);
  };
  
  return { 
    needsRefresh,
    markRefreshComplete
  };
}

export default usePhotoPointsNavigation;


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
  const processingRef = useRef(false);
  
  // Process navigation from PhotoPoints
  useEffect(() => {
    // Skip if no locationId, already processed, or currently processing
    if (!locationId || refreshHandledRef.current || processingRef.current) {
      return;
    }
    
    // Prevent reentrant calls (especially important on Safari)
    processingRef.current = true;
    
    // Check if we're coming from PhotoPoints page
    const fromPhotoPoints = location.state?.fromPhotoPoints === true;
    
    if (fromPhotoPoints) {
      console.log("Detected navigation from PhotoPoints page with ID:", locationId);
      refreshHandledRef.current = true;
      
      try {
        processPhotoPointsNavigation(locationId);
      } catch (error) {
        console.error("Error processing PhotoPoints navigation:", error);
      } finally {
        processingRef.current = false;
      }
    } else {
      processingRef.current = false;
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
      
      // Even if we don't have existing data, try to use location.state
      if (location.state) {
        const stateData = {
          ...location.state,
          fromPhotoPoints: true
        };
        
        // Save what we have from state
        saveLocationFromPhotoPoints(stateData);
        setNeedsRefresh(true);
      }
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


import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { saveLocationFromPhotoPoints, getLocationDetailsById } from "@/utils/locationStorage";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
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
  }, [location.state, locationId, t]);
  
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
      
      // Show toast to indicate refresh with new styling
      toast.info(t("Refreshing location data...", "正在刷新位置数据..."), {
        duration: 500, // 0.5 second duration
        style: {
          backgroundColor: 'rgba(0,0,0,0.6)', // More transparent background
          backdropFilter: 'blur(4px)', // Dynamic blur effect
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)'
        }
      });
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

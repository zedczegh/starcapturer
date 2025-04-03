
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
  
  useEffect(() => {
    // Check if we're coming from PhotoPoints page
    const fromPhotoPoints = location.state?.fromPhotoPoints === true;
    
    // Only handle if not already processed and we have a valid location ID
    if (fromPhotoPoints && !refreshHandledRef.current && locationId) {
      console.log("Detected navigation from PhotoPoints page with ID:", locationId);
      refreshHandledRef.current = true;
      
      try {
        // Get existing location data
        const existingData = getLocationDetailsById(locationId);
        
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
          
          // Show toast to indicate refresh
          toast.info(t("Refreshing location data...", "正在刷新位置数据..."), {
            duration: 2000
          });
        } else {
          console.warn(`No existing location data found for ID: ${locationId}`);
        }
      } catch (error) {
        console.error("Error processing PhotoPoints navigation:", error);
      }
    }
  }, [location.state, locationId, t]);
  
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

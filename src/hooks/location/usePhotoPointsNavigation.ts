
import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { saveLocationFromPhotoPoints, getLocationDetailsById } from "@/utils/locationStorage";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Hook to handle navigation from PhotoPoints page to location details
 * Ensures proper refresh handling and prevents infinite refresh loops
 */
export function usePhotoPointsNavigation(locationId: string | undefined) {
  const location = useLocation();
  const { t } = useLanguage();
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const refreshHandledRef = useRef(false);
  
  useEffect(() => {
    // Check if we're coming from PhotoPoints page
    const fromPhotoPoints = location.state?.fromPhotoPoints === true;
    
    // Only handle if not already processed
    if (fromPhotoPoints && !refreshHandledRef.current && locationId) {
      console.log("Detected navigation from PhotoPoints page");
      refreshHandledRef.current = true;
      
      // Get existing location data
      const existingData = getLocationDetailsById(locationId);
      
      // Update the data with the fromPhotoPoints flag
      if (existingData) {
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
      }
    }
  }, [location.state, locationId, t]);
  
  return { 
    needsRefresh,
    markRefreshComplete: () => {
      refreshHandledRef.current = true;
      setNeedsRefresh(false);
    }
  };
}

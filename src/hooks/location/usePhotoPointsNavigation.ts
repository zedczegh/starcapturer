
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
    // Only process if coming from PhotoPoints and not already handled
    if (location.state?.fromPhotoPoints === true && !refreshHandledRef.current && locationId) {
      console.log("Detected navigation from PhotoPoints page with ID:", locationId);
      
      // Mark as handled to prevent repeated processing
      refreshHandledRef.current = true;
      
      // Get existing location data
      const existingData = getLocationDetailsById(locationId);
      
      if (existingData) {
        // Update the data with the fromPhotoPoints flag
        const updatedData = {
          ...existingData,
          fromPhotoPoints: true,
          timestamp: new Date().toISOString() // Update timestamp for freshness
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
  
  // Reset on unmount
  useEffect(() => {
    return () => {
      refreshHandledRef.current = false;
    };
  }, []);
  
  return { 
    needsRefresh,
    markRefreshComplete: () => {
      setNeedsRefresh(false);
    }
  };
}

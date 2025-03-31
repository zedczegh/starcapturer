
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
  const refreshAttemptCountRef = useRef(0);
  const lastRefreshTimeRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef(true);
  
  // Check if enough time has passed since last refresh (5 seconds)
  const canRefreshAgain = () => {
    if (!lastRefreshTimeRef.current) return true;
    const timeElapsed = Date.now() - lastRefreshTimeRef.current;
    return timeElapsed > 5000; // Minimum 5 seconds between refreshes
  };
  
  // Handle initial refresh logic
  useEffect(() => {
    // Only process on initial load or when state changes
    if (!isInitialLoadRef.current && !location.state) return;
    
    // Check if we're coming from PhotoPoints page
    const fromPhotoPoints = location.state?.fromPhotoPoints === true;
    
    // Reset initial load flag
    isInitialLoadRef.current = false;
    
    // Skip if already handled or missing locationId
    if (!fromPhotoPoints || refreshHandledRef.current || !locationId) return;
    
    // Only proceed if we can refresh again (time threshold)
    if (!canRefreshAgain()) {
      console.log("Refresh attempted too soon, skipping");
      return;
    }
    
    // Increment refresh attempt counter
    refreshAttemptCountRef.current += 1;
    
    // Only proceed if we haven't tried too many times
    if (refreshAttemptCountRef.current <= 2) {
      console.log("Processing navigation from PhotoPoints page");
      
      // Set refresh handled to true temporarily
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
        
        // Update last refresh time
        lastRefreshTimeRef.current = Date.now();
        
        // Show toast to indicate refresh
        toast.info(t("Refreshing location data...", "正在刷新位置数据..."), {
          duration: 2000
        });
      } else {
        // Save new data with fromPhotoPoints flag if it doesn't exist
        if (location.state) {
          saveLocationFromPhotoPoints({
            ...location.state,
            fromPhotoPoints: true
          });
          
          // Indicate that a refresh is needed
          setNeedsRefresh(true);
          
          // Update last refresh time
          lastRefreshTimeRef.current = Date.now();
        }
      }
    } else {
      console.log("Too many refresh attempts, skipping");
      refreshHandledRef.current = true;
    }
  }, [location.state, locationId, t]);
  
  return { 
    needsRefresh,
    markRefreshComplete: () => {
      refreshHandledRef.current = true;
      setNeedsRefresh(false);
      
      // Reset refresh attempt counter after successful refresh
      refreshAttemptCountRef.current = 0;
    }
  };
}

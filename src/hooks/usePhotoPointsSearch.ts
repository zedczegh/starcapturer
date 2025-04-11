
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/siqs/types';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { updateWithRealTimeSiqs } from '@/hooks/photoPoints/useRecommendedLocationsFix';

interface UsePhotoPointsSearchProps {
  userLocation: { latitude: number; longitude: number } | null;
  currentSiqs: number | null;
  maxInitialResults?: number;
}

/**
 * Hook to manage photo points search and display
 * Refactored for better stability and organization
 */
export const usePhotoPointsSearch = ({
  userLocation,
  currentSiqs,
  maxInitialResults = 5
}: UsePhotoPointsSearchProps) => {
  const { t } = useLanguage();
  const [displayedLocations, setDisplayedLocations] = useState<SharedAstroSpot[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(0);

  // Set up recommended locations
  const {
    locations,
    loading: locationsLoading,
    searching,
    refreshSiqsData,
  } = useRecommendedLocations(userLocation, 100); // Always start with 100km radius for calculated

  // Initialize locations from cache if available while waiting for API
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem('cachedRecommendedLocations');
      if (!initialLoadComplete && cachedData) {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDisplayedLocations(parsed.slice(0, maxInitialResults));
        }
      }
    } catch (error) {
      console.error("Error loading cached locations:", error);
    }
  }, [maxInitialResults, initialLoadComplete]);

  // Update displayed locations when fetched locations change
  useEffect(() => {
    const now = Date.now();
    // Avoid too frequent updates (at least 500ms apart)
    if (now - lastUpdateTimestamp < 500) return;
    
    if (locations.length > 0) {
      // Process and sort locations
      const processAndUpdateLocations = async () => {
        // First sort by certification, then by SIQS, then by distance
        const sortedLocations = [...locations].sort((a, b) => {
          // First sort by certification status
          if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) {
            return -1;
          }
          if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) {
            return 1;
          }
          
          // Then sort by nighttime SIQS if available
          const aSiqs = a.siqsResult?.score ?? a.siqs ?? 0;
          const bSiqs = b.siqsResult?.score ?? b.siqs ?? 0;
          
          if (aSiqs !== bSiqs) {
            return bSiqs - aSiqs; // Higher SIQS first
          }
          
          // Finally sort by distance
          return (a.distance || Infinity) - (b.distance || Infinity);
        });
        
        // Update the displayed locations
        setDisplayedLocations(sortedLocations.slice(0, maxInitialResults));
        setInitialLoadComplete(true);
        setLastUpdateTimestamp(now);
        
        // Save to localStorage for faster future loads
        try {
          localStorage.setItem('cachedRecommendedLocations', JSON.stringify(sortedLocations));
        } catch (error) {
          console.error("Error saving locations to cache:", error);
        }
      };
      
      processAndUpdateLocations();
    }
  }, [locations, maxInitialResults, lastUpdateTimestamp]);

  // Handle errors and refresh data
  const handleRefresh = useCallback(async () => {
    if (!userLocation) {
      toast.error(t("No location selected", "未选择位置"));
      return;
    }
    
    toast.info(t("Refreshing locations...", "正在刷新位置..."));
    await refreshSiqsData();
    
    // After refreshing, update with real-time SIQS values
    if (displayedLocations.length > 0) {
      const updatedLocations = await updateWithRealTimeSiqs(displayedLocations);
      if (updatedLocations.length > 0) {
        setDisplayedLocations(updatedLocations.slice(0, maxInitialResults));
      }
    }
  }, [refreshSiqsData, t, userLocation, displayedLocations, maxInitialResults]);

  return {
    displayedLocations,
    loading: locationsLoading && !initialLoadComplete,
    searching,
    refresh: handleRefresh
  };
};

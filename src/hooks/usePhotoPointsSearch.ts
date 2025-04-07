
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface UsePhotoPointsSearchProps {
  userLocation: { latitude: number; longitude: number } | null;
  currentSiqs: number | null;
  maxInitialResults?: number;
}

export const usePhotoPointsSearch = ({
  userLocation,
  currentSiqs,
  maxInitialResults = 5
}: UsePhotoPointsSearchProps) => {
  const { t } = useLanguage();
  const [displayedLocations, setDisplayedLocations] = useState<SharedAstroSpot[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

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
          console.log("Using cached locations initially:", parsed.length);
        }
      }
    } catch (error) {
      console.error("Error loading cached locations:", error);
    }
  }, [maxInitialResults, initialLoadComplete]);

  // Update displayed locations when fetched locations change
  useEffect(() => {
    if (locations.length > 0) {
      const sortedLocations = [...locations].sort((a, b) => {
        // First sort by certification status
        if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) {
          return -1;
        }
        if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) {
          return 1;
        }
        
        // Then sort by distance
        return (a.distance || Infinity) - (b.distance || Infinity);
      });
      
      setDisplayedLocations(sortedLocations.slice(0, maxInitialResults));
      setInitialLoadComplete(true);
      
      // Save to localStorage for faster future loads
      try {
        localStorage.setItem('cachedRecommendedLocations', JSON.stringify(sortedLocations));
      } catch (error) {
        console.error("Error saving locations to cache:", error);
      }
    }
  }, [locations, maxInitialResults]);

  // Handle errors and refresh data
  const handleRefresh = useCallback(() => {
    if (!userLocation) {
      toast.error(t("No location selected", "未选择位置"));
      return;
    }
    
    toast.info(t("Refreshing locations...", "正在刷新位置..."));
    refreshSiqsData();
  }, [refreshSiqsData, t, userLocation]);

  return {
    displayedLocations,
    loading: locationsLoading && !initialLoadComplete,
    searching,
    refresh: handleRefresh
  };
};

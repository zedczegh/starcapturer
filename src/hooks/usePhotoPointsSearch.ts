
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots'; // Updated import
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
          // Ensure all cached locations have an ID
          const validLocations = parsed.map((loc: any) => {
            if (!loc.id && loc.latitude && loc.longitude) {
              return {
                ...loc,
                id: `loc-${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`
              };
            }
            return loc;
          });
          
          setDisplayedLocations(validLocations.slice(0, maxInitialResults));
          console.log("Using cached locations initially:", validLocations.length);
        }
      }
    } catch (error) {
      console.error("Error loading cached locations:", error);
    }
  }, [maxInitialResults, initialLoadComplete]);

  // Update displayed locations when fetched locations change
  useEffect(() => {
    if (locations.length > 0) {
      // Ensure all locations have an ID
      const locationsWithIds = locations.map(loc => {
        if (!loc.id && loc.latitude && loc.longitude) {
          return {
            ...loc,
            id: `loc-${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`
          };
        }
        return loc;
      });
      
      const sortedLocations = [...locationsWithIds].sort((a, b) => {
        // First sort by certification status
        if ((a.isDarkSkyReserve || a.certification) && !(b.isDarkSkyReserve || b.certification)) {
          return -1;
        }
        if (!(a.isDarkSkyReserve || a.certification) && (b.isDarkSkyReserve || b.certification)) {
          return 1;
        }
        
        // Then sort by nighttime SIQS if available, otherwise by distance
        const aSiqs = a.siqsResult?.score ?? a.siqs ?? 0;
        const bSiqs = b.siqsResult?.score ?? b.siqs ?? 0;
        
        if (aSiqs !== bSiqs) {
          return bSiqs - aSiqs; // Higher SIQS first
        }
        
        // Finally sort by distance
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

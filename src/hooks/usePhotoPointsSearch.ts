
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { isWaterLocation } from '@/utils/locationValidator';
import { calculateDistance } from '@/utils/geoUtils';

interface UsePhotoPointsSearchProps {
  userLocation: { latitude: number; longitude: number } | null;
  currentSiqs: number | null;
  searchRadius?: number;
  maxInitialResults?: number;
}

export const usePhotoPointsSearch = ({
  userLocation,
  currentSiqs,
  searchRadius = 100,
  maxInitialResults = 5
}: UsePhotoPointsSearchProps) => {
  const { t } = useLanguage();
  const [displayedLocations, setDisplayedLocations] = useState<SharedAstroSpot[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Set up recommended locations - pass the searchRadius from props
  const {
    locations,
    loading: locationsLoading,
    searching,
    refreshSiqsData,
  } = useRecommendedLocations(userLocation, searchRadius);

  // Initialize locations from cache if available while waiting for API
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem('cachedRecommendedLocations');
      if (!initialLoadComplete && cachedData) {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter cached locations by current radius
          const filteredByRadius = userLocation 
            ? parsed.filter(loc => {
                // Never filter certified locations by distance
                if (loc.isDarkSkyReserve || loc.certification) return true;
                
                // Calculate distance if not already set
                const distance = loc.distance || calculateDistance(
                  userLocation.latitude, 
                  userLocation.longitude,
                  loc.latitude,
                  loc.longitude
                );
                
                // Only include locations within current radius
                return distance <= searchRadius;
              })
            : parsed;
            
          setDisplayedLocations(filteredByRadius.slice(0, maxInitialResults));
          console.log(`Using cached locations initially: ${filteredByRadius.length} locations within ${searchRadius}km radius`);
        }
      }
    } catch (error) {
      console.error("Error loading cached locations:", error);
    }
  }, [maxInitialResults, initialLoadComplete, searchRadius, userLocation]);

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
      
      // Filter out water locations for calculated spots
      const filteredLocations = sortedLocations.filter(loc => {
        // Never filter out certified locations
        if (loc.isDarkSkyReserve || loc.certification) return true;
        
        // Filter out water locations for calculated spots
        return !isWaterLocation(loc.latitude, loc.longitude);
      });
      
      // Filter by current radius for non-certified locations
      const filteredByRadius = userLocation
        ? filteredLocations.filter(loc => {
            // Never filter certified locations by distance
            if (loc.isDarkSkyReserve || loc.certification) return true;
            
            // Use existing distance or calculate it
            const distance = loc.distance || calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              loc.latitude,
              loc.longitude
            );
            
            // Only include locations within current radius
            return distance <= searchRadius;
          })
        : filteredLocations;
      
      setDisplayedLocations(filteredByRadius.slice(0, maxInitialResults));
      setInitialLoadComplete(true);
      
      // Save to localStorage for faster future loads
      try {
        localStorage.setItem('cachedRecommendedLocations', JSON.stringify(filteredLocations));
      } catch (error) {
        console.error("Error saving locations to cache:", error);
      }
    }
  }, [locations, maxInitialResults, searchRadius, userLocation]);

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


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
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('certified');

  // Set up recommended locations - pass the searchRadius from props
  // Always use a large radius for certified locations to get all of them globally
  const effectiveRadius = activeView === 'certified' ? 100000 : searchRadius;
  
  const {
    locations,
    loading: locationsLoading,
    searching,
    refreshSiqsData,
  } = useRecommendedLocations(userLocation, effectiveRadius);

  // Initialize locations from cache if available while waiting for API
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem('cachedRecommendedLocations');
      if (!initialLoadComplete && cachedData) {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // For certified locations, don't filter by radius
          const filteredLocations = activeView === 'certified'
            ? parsed.filter(loc => loc.isDarkSkyReserve || loc.certification)
            : userLocation 
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
            
          setDisplayedLocations(filteredLocations.slice(0, maxInitialResults));
          console.log(`Using cached locations initially: ${filteredLocations.length} locations`);
        }
      }
    } catch (error) {
      console.error("Error loading cached locations:", error);
    }
  }, [maxInitialResults, initialLoadComplete, searchRadius, userLocation, activeView]);

  // Update displayed locations when fetched locations change
  useEffect(() => {
    if (locations.length > 0) {
      // Separate certified and calculated locations
      const certifiedLocs = locations.filter(
        loc => loc.isDarkSkyReserve || loc.certification
      );
      
      const calculatedLocs = locations.filter(
        loc => !(loc.isDarkSkyReserve || loc.certification)
      );
      
      console.log(`Found ${certifiedLocs.length} certified and ${calculatedLocs.length} calculated locations`);
      
      // Select locations based on active view
      let selectedLocations = activeView === 'certified' ? certifiedLocs : calculatedLocs;
      
      // For calculated spots only, filter by distance and water
      if (activeView === 'calculated') {
        // Filter out water locations for calculated spots
        selectedLocations = selectedLocations.filter(loc => !isWaterLocation(loc.latitude, loc.longitude));
        
        // Filter by current radius for calculated locations
        if (userLocation) {
          selectedLocations = selectedLocations.filter(loc => {
            const distance = loc.distance || calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              loc.latitude,
              loc.longitude
            );
            
            return distance <= searchRadius;
          });
        }
      }
      
      // Sort locations by certification and distance
      const sortedLocations = [...selectedLocations].sort((a, b) => {
        // First sort by certification status within each category
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
        localStorage.setItem('cachedRecommendedLocations', JSON.stringify([...certifiedLocs, ...calculatedLocs]));
      } catch (error) {
        console.error("Error saving locations to cache:", error);
      }
    }
  }, [locations, maxInitialResults, searchRadius, userLocation, activeView]);

  // Handle errors and refresh data
  const handleRefresh = useCallback(() => {
    if (!userLocation) {
      toast.error(t("No location selected", "未选择位置"));
      return;
    }
    
    toast.info(t("Refreshing locations...", "正在刷新位置..."));
    refreshSiqsData();
  }, [refreshSiqsData, t, userLocation]);

  // Function to switch view type
  const switchView = useCallback((view: 'certified' | 'calculated') => {
    setActiveView(view);
  }, []);

  return {
    displayedLocations,
    loading: locationsLoading && !initialLoadComplete,
    searching,
    refresh: handleRefresh,
    switchView,
    activeView
  };
};

export default usePhotoPointsSearch;

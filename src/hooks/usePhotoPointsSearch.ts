
import { useState, useEffect, useCallback, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { isWaterLocation } from '@/utils/validation';
import { calculateDistance } from '@/utils/geoUtils';
import { isCertifiedLocation } from '@/utils/locationFiltering';

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
  maxInitialResults = 50 // Increased from 5 to 50 to show more locations initially
}: UsePhotoPointsSearchProps) => {
  const { t } = useLanguage();
  const [displayedLocations, setDisplayedLocations] = useState<SharedAstroSpot[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('certified');
  const previousLocationsRef = useRef<SharedAstroSpot[]>([]);
  
  // Use a larger radius for certified locations to get all of them globally
  const effectiveRadius = activeView === 'certified' ? 100000 : searchRadius;
  
  const {
    locations,
    loading: locationsLoading,
    searching,
    refreshSiqsData,
  } = useRecommendedLocations(userLocation, effectiveRadius);
  
  // Cache certified locations to prevent repeated network calls
  useEffect(() => {
    if (locations.length > 0) {
      const certifiedLocs = locations.filter(loc => 
        isCertifiedLocation(loc)
      );
      
      if (certifiedLocs.length > 0) {
        try {
          localStorage.setItem('certifiedLocationsCache', JSON.stringify(certifiedLocs));
        } catch (error) {
          console.error("Error saving certified locations to cache:", error);
        }
      }
    }
  }, [locations]);

  // Initialize locations from cache if available while waiting for API
  useEffect(() => {
    // For certified view, try to use cached certified locations for immediate display
    if (activeView === 'certified' && !initialLoadComplete) {
      try {
        const cachedCertifiedData = localStorage.getItem('certifiedLocationsCache');
        const cachedData = localStorage.getItem('cachedRecommendedLocations');
        
        // First try certified-specific cache
        if (cachedCertifiedData) {
          const parsed = JSON.parse(cachedCertifiedData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDisplayedLocations(parsed);
            console.log(`Using ${parsed.length} cached certified locations`);
            return;
          }
        }
        
        // Fall back to general cache for certified locations
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const certifiedFromCache = parsed.filter(loc => 
              loc.isDarkSkyReserve || loc.certification
            );
            
            if (certifiedFromCache.length > 0) {
              setDisplayedLocations(certifiedFromCache);
              console.log(`Using ${certifiedFromCache.length} certified locations from general cache`);
            }
          }
        }
      } catch (error) {
        console.error("Error loading cached locations:", error);
      }
    } else if (activeView === 'calculated' && !initialLoadComplete) {
      try {
        const cachedData = localStorage.getItem('cachedRecommendedLocations');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // For calculated locations, filter by distance
            const filteredLocations = userLocation 
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
            
            const locationsToDisplay = filteredLocations.slice(0, maxInitialResults);
            setDisplayedLocations(locationsToDisplay);
            console.log(`Using cached locations for calculated view: ${filteredLocations.length} locations`);
          }
        }
      } catch (error) {
        console.error("Error loading cached locations:", error);
      }
    }
  }, [maxInitialResults, initialLoadComplete, searchRadius, userLocation, activeView]);

  // Update displayed locations when fetched locations change
  useEffect(() => {
    if (locations.length > 0) {
      // Save previous locations to prevent losing them
      previousLocationsRef.current = locations;
      
      // Separate certified and calculated locations
      const certifiedLocs = locations.filter(
        loc => isCertifiedLocation(loc)
      );
      
      const calculatedLocs = locations.filter(
        loc => !isCertifiedLocation(loc)
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
      
      setDisplayedLocations(sortedLocations);
      setInitialLoadComplete(true);
      
      // Save to localStorage for faster future loads
      try {
        localStorage.setItem('cachedRecommendedLocations', JSON.stringify([...certifiedLocs, ...calculatedLocs]));
      } catch (error) {
        console.error("Error saving locations to cache:", error);
      }
    }
  }, [locations, searchRadius, userLocation, activeView]);

  // Handle errors and refresh data
  const handleRefresh = useCallback(() => {
    if (!userLocation) {
      toast.error(t("No location selected", "未选择位置"));
      return;
    }
    
    toast.info(t("Refreshing locations...", "正在刷新位置..."));
    refreshSiqsData();
  }, [refreshSiqsData, t, userLocation]);

  // Function to switch view type with improved handling to prevent freezing
  const switchView = useCallback((view: 'certified' | 'calculated') => {
    if (view !== activeView) {
      console.log(`Switching view from ${activeView} to ${view}`);
      
      // To prevent freezing, we'll pre-load the destinations before switching
      if (view === 'certified') {
        try {
          // First see if we have cached certified locations
          const cachedCertifiedData = localStorage.getItem('certifiedLocationsCache');
          if (cachedCertifiedData) {
            const parsed = JSON.parse(cachedCertifiedData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setDisplayedLocations(parsed);
            }
          } else {
            // Filter existing locations for immediate display
            const certifiedLocs = previousLocationsRef.current.filter(
              loc => isCertifiedLocation(loc)
            );
            if (certifiedLocs.length > 0) {
              setDisplayedLocations(certifiedLocs);
            }
          }
        } catch (error) {
          console.error("Error preparing certified view:", error);
        }
      }
      
      // Now actually change the view
      setActiveView(view);
    }
  }, [activeView]);

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


import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { isWaterLocation } from '@/utils/validation';
import { calculateDistance } from '@/utils/geoUtils';
import { isCertifiedLocation } from '@/utils/locationFiltering';
import { preloadCertifiedLocations } from '@/services/certifiedLocationsService';

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
  const [allCertifiedLocations, setAllCertifiedLocations] = useState<SharedAstroSpot[]>([]);

  // Always use a large radius for certified locations to get ALL of them globally
  const effectiveRadius = activeView === 'certified' ? 500000 : searchRadius;
  
  const {
    locations,
    loading: locationsLoading,
    searching,
    refreshSiqsData,
  } = useRecommendedLocations(userLocation, effectiveRadius);

  // Load all certified locations on first mount
  useEffect(() => {
    const loadAllCertifiedLocations = async () => {
      try {
        const certifiedLocations = await preloadCertifiedLocations();
        console.log(`Loaded ${certifiedLocations.length} ALL certified locations globally`);
        setAllCertifiedLocations(certifiedLocations);
        
        // If we're in certified view, update displayed locations immediately
        if (activeView === 'certified') {
          setDisplayedLocations(certifiedLocations);
          setInitialLoadComplete(true);
        }
      } catch (error) {
        console.error("Error loading all certified locations:", error);
      }
    };
    
    loadAllCertifiedLocations();
  }, []);

  // Initialize locations from cache if available while waiting for API
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem('cachedRecommendedLocations');
      if (!initialLoadComplete && cachedData) {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // For certified locations, don't filter at all
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
            
          // Don't limit certified locations during initial load
          const locationsToDisplay = activeView === 'certified' 
            ? filteredLocations.concat(allCertifiedLocations)
            : filteredLocations.slice(0, maxInitialResults);
            
          setDisplayedLocations(locationsToDisplay);
          console.log(`Using cached locations initially: ${filteredLocations.length} locations`);
        }
      }
    } catch (error) {
      console.error("Error loading cached locations:", error);
    }
  }, [maxInitialResults, initialLoadComplete, searchRadius, userLocation, activeView, allCertifiedLocations]);

  // Update displayed locations when fetched locations change
  useEffect(() => {
    if (locations.length > 0 || allCertifiedLocations.length > 0) {
      // If we're in certified view, always use ALL certified locations
      if (activeView === 'certified') {
        console.log(`Using ${allCertifiedLocations.length} certified locations from global pool`);
        
        // Combine with any certified locations from regular locations
        const certifiedFromRegular = locations.filter(
          loc => isCertifiedLocation(loc)
        );
        
        // Use a Map to deduplicate locations by coordinates
        const locationMap = new Map<string, SharedAstroSpot>();
        
        // Add all certified locations from both sources
        [...allCertifiedLocations, ...certifiedFromRegular].forEach(loc => {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locationMap.set(key, loc);
        });
        
        const combinedCertified = Array.from(locationMap.values());
        console.log(`Combined ${combinedCertified.length} total certified locations`);
        
        setDisplayedLocations(combinedCertified);
      } else {
        // For calculated view, process as normal
        // Separate certified and calculated locations
        const certifiedLocs = locations.filter(
          loc => isCertifiedLocation(loc)
        );
        
        const calculatedLocs = locations.filter(
          loc => !isCertifiedLocation(loc)
        );
        
        console.log(`Found ${certifiedLocs.length} certified and ${calculatedLocs.length} calculated locations`);
        
        // Filter calculated spots by distance and water
        let filteredCalculated = calculatedLocs;
        
        // Filter out water locations for calculated spots
        filteredCalculated = filteredCalculated.filter(loc => !isWaterLocation(loc.latitude, loc.longitude));
        
        // Filter by current radius for calculated locations
        if (userLocation) {
          filteredCalculated = filteredCalculated.filter(loc => {
            const distance = loc.distance || calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              loc.latitude,
              loc.longitude
            );
            
            return distance <= searchRadius;
          });
        }
        
        // Sort locations by certification and distance
        const sortedLocations = [...filteredCalculated].sort((a, b) => {
          return (a.distance || Infinity) - (b.distance || Infinity);
        });
        
        setDisplayedLocations(sortedLocations);
      }
      
      setInitialLoadComplete(true);
      
      // Save to localStorage for faster future loads
      try {
        localStorage.setItem('cachedRecommendedLocations', JSON.stringify(locations));
      } catch (error) {
        console.error("Error saving locations to cache:", error);
      }
    }
  }, [locations, searchRadius, userLocation, activeView, allCertifiedLocations]);

  // Handle errors and refresh data
  const handleRefresh = useCallback(() => {
    if (!userLocation) {
      toast.error(t("No location selected", "未选择位置"));
      return;
    }
    
    toast.info(t("Refreshing locations...", "正在刷新位置..."));
    refreshSiqsData();
    
    // Also refresh certified locations
    const refreshCertified = async () => {
      try {
        const refreshedLocations = await preloadCertifiedLocations();
        setAllCertifiedLocations(refreshedLocations);
        if (activeView === 'certified') {
          setDisplayedLocations(refreshedLocations);
        }
      } catch (error) {
        console.error("Error refreshing certified locations:", error);
      }
    };
    
    refreshCertified();
  }, [refreshSiqsData, t, userLocation, activeView]);

  // Function to switch view type
  const switchView = useCallback((view: 'certified' | 'calculated') => {
    setActiveView(view);
    
    // Immediately update displayed locations based on new view
    if (view === 'certified' && allCertifiedLocations.length > 0) {
      setDisplayedLocations(allCertifiedLocations);
    } else if (view === 'calculated' && locations.length > 0) {
      // Filter calculated locations
      const calculatedLocs = locations.filter(
        loc => !isCertifiedLocation(loc)
      );
      
      let filteredCalculated = calculatedLocs;
      
      // Filter out water locations
      filteredCalculated = filteredCalculated.filter(loc => !isWaterLocation(loc.latitude, loc.longitude));
      
      // Filter by current radius
      if (userLocation) {
        filteredCalculated = filteredCalculated.filter(loc => {
          const distance = loc.distance || calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            loc.latitude,
            loc.longitude
          );
          
          return distance <= searchRadius;
        });
      }
      
      setDisplayedLocations(filteredCalculated);
    }
  }, [allCertifiedLocations, locations, userLocation, searchRadius]);

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


import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { isWaterLocation } from '@/utils/validation';
import { calculateDistance } from '@/utils/geoUtils';
import { isCertifiedLocation } from '@/utils/locationFiltering';
import { getEffectiveCloudCover } from '@/lib/siqs/weatherDataUtils';

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
  maxInitialResults = 50
}: UsePhotoPointsSearchProps) => {
  const { t } = useLanguage();
  const [displayedLocations, setDisplayedLocations] = useState<SharedAstroSpot[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('certified');

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
            
          // Apply quality filtering for meaningful locations
          const meaningfulLocations = activeView === 'certified' 
            ? filteredLocations 
            : filterMeaningfulLocations(filteredLocations);
            
          // Don't limit certified locations
          const locationsToDisplay = activeView === 'certified' 
            ? meaningfulLocations 
            : meaningfulLocations.slice(0, maxInitialResults);
            
          setDisplayedLocations(locationsToDisplay);
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
          
          // Apply enhanced quality filtering
          selectedLocations = filterMeaningfulLocations(selectedLocations);
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
        
        // Then sort by SIQS score and distance using weighted formula
        const aScore = typeof a.siqs === 'number' ? a.siqs : 0;
        const bScore = typeof b.siqs === 'number' ? b.siqs : 0;
        
        const aQuality = (aScore * 0.7) - ((a.distance || 0) * 0.3);
        const bQuality = (bScore * 0.7) - ((b.distance || 0) * 0.3);
        
        return bQuality - aQuality;
      });
      
      // Don't apply limits to certified locations view
      const locationsToDisplay = activeView === 'certified' 
        ? sortedLocations 
        : sortedLocations.slice(0, maxInitialResults);
        
      setDisplayedLocations(locationsToDisplay);
      setInitialLoadComplete(true);
      
      // Save to localStorage for faster future loads
      try {
        localStorage.setItem('cachedRecommendedLocations', JSON.stringify([...certifiedLocs, ...calculatedLocs]));
      } catch (error) {
        console.error("Error saving locations to cache:", error);
      }
    }
  }, [locations, maxInitialResults, searchRadius, userLocation, activeView]);

  /**
   * Filter locations to only show meaningful ones
   * based on weather data, SIQS scores, and other factors
   */
  const filterMeaningfulLocations = (locations: SharedAstroSpot[]): SharedAstroSpot[] => {
    return locations.filter(loc => {
      // Always include certified locations
      if (loc.isDarkSkyReserve || loc.certification) {
        return true;
      }
      
      // Ensure SIQS score meets minimum quality threshold
      if (!loc.siqs || loc.siqs < 50) {
        return false;
      }
      
      // Check weather data if available
      if (loc.weatherData) {
        // Get effective cloud cover considering precipitation and conditions
        const effectiveCloudCover = getEffectiveCloudCover(
          loc.weatherData.cloudCover,
          loc.weatherData.precipitation,
          loc.weatherData.weatherCondition
        );
        
        // Filter out locations with poor viewing conditions
        if (effectiveCloudCover > 70) {
          return false;
        }
        
        // Filter based on precipitation
        if (loc.weatherData.precipitation && loc.weatherData.precipitation > 1) {
          return false;
        }
      }
      
      // Always include viable spots
      if (loc.isViable) {
        return true;
      }
      
      // Include spots with higher quality despite distance
      const qualityDistanceRatio = (loc.siqs / 10) - (loc.distance || 0) / 100;
      if (qualityDistanceRatio > 0.5) {
        return true;
      }
      
      return false;
    });
  };

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

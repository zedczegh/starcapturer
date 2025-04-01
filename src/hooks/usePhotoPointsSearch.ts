import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { 
  findLocationsWithinRadius, 
  findCalculatedLocations 
} from "@/services/locationSearchService";
import { clearSiqsCache } from '@/services/realTimeSiqsService';
import { clearLocationSearchCache } from "@/services/locationCacheService";
import { isValidAstronomyLocation } from "@/utils/locationValidator";
import { currentSiqsStore } from "@/components/index/CalculatorSection";

interface UsePhotoPointsSearchProps {
  userLocation: { latitude: number; longitude: number } | null;
  currentSiqs: number | null;
  maxInitialResults?: number;
}

// Maximum search distance
const MAX_SEARCH_DISTANCE = 10000; // 10,000 km
// Maximum calculated locations to request per batch
const MAX_CALCULATED_LOCATIONS = 10;
// Maximum number of "load more" clicks allowed
const MAX_LOAD_MORE_CLICKS = 2;

export const usePhotoPointsSearch = ({
  userLocation,
  currentSiqs,
  maxInitialResults = 5
}: UsePhotoPointsSearchProps) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchDistance, setSearchDistance] = useState(1000); // Default 1000km
  const [allLocations, setAllLocations] = useState<SharedAstroSpot[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<SharedAstroSpot[]>([]);
  const [displayedLocations, setDisplayedLocations] = useState<SharedAstroSpot[]>([]);
  const [hasMoreLocations, setHasMoreLocations] = useState(false);
  const [isUserInGoodLocation, setIsUserInGoodLocation] = useState(false);
  const [lastSearchParams, setLastSearchParams] = useState<string>('');
  const [loadMoreClickCount, setLoadMoreClickCount] = useState(0);
  const [canLoadMoreCalculated, setCanLoadMoreCalculated] = useState(false);
  
  // Load recommended locations based on user location and search radius
  const loadRecommendedLocations = useCallback(async (reset: boolean = true) => {
    if (!userLocation) return;
    
    // Generate search params signature
    const searchParams = `${userLocation.latitude.toFixed(5)}-${userLocation.longitude.toFixed(5)}-${searchDistance}`;
    
    // Skip if the same search was already performed (unless forced reset)
    if (!reset && searchParams === lastSearchParams) {
      return;
    }
    
    setSearching(true);
    console.log(`Loading recommended locations with radius: ${searchDistance}km, reset: ${reset}`);
    
    try {
      // Clear caches to ensure fresh data when radius changes
      if (searchParams !== lastSearchParams) {
        clearSiqsCache();
        clearLocationSearchCache();
      }
      
      // Find locations within radius - with limited locations requested
      const locations = await findLocationsWithinRadius(
        userLocation.latitude,
        userLocation.longitude,
        searchDistance
      );
      
      if (locations.length === 0) {
        // If no locations found, try with calculated recommendations
        console.log("No standard locations found, trying calculated search");
        const calculatedLocations = await findCalculatedLocations(
          userLocation.latitude,
          userLocation.longitude,
          searchDistance
        );
        
        // Apply water filtering again to ensure no water locations
        let validLocations = calculatedLocations.filter(loc => {
          // Double-check that these locations are not on water
          if (!isValidAstronomyLocation(loc.latitude, loc.longitude, loc.name)) {
            console.log(`Filtered out ${loc.name} at ${loc.latitude}, ${loc.longitude} as invalid astronomy location`);
            return false;
          }
          
          // Also filter out locations with SIQS=0
          return loc.siqs !== undefined && loc.siqs > 0;
        });
        
        if (validLocations.length > 0) {
          setAllLocations(validLocations);
          setFilteredLocations(validLocations);
          setDisplayedLocations(validLocations.slice(0, maxInitialResults));
          setHasMoreLocations(validLocations.length > maxInitialResults);
          setCanLoadMoreCalculated(true); // Enable load more for calculated
          setLoadMoreClickCount(0); // Reset click counter
          
          toast.info(
            language === "en" 
              ? "Using calculated locations with good viewing conditions" 
              : "使用计算出的良好观测条件位置",
            { 
              description: language === "en" 
                ? "These are areas likely to have clear skies" 
                : "这些是可能有晴朗天空的区域"
            }
          );
        } else {
          setAllLocations([]);
          setFilteredLocations([]);
          setDisplayedLocations([]);
          setHasMoreLocations(false);
          setCanLoadMoreCalculated(false);
          
          toast.error(
            language === "en" 
              ? "No locations found within search radius" 
              : "在搜索半径内未找到位置",
            { 
              description: language === "en" 
                ? "Try increasing your search radius" 
                : "尝试增加您的搜索半径"
            }
          );
        }
      } else {
        // Filter out any locations with SIQS=0 from the standard results too
        // And also filter out any water locations
        const validLocations = locations.filter(loc => {
          // First check if location is valid (not on water)
          if (!isValidAstronomyLocation(loc.latitude, loc.longitude, loc.name)) {
            console.log(`Filtered out ${loc.name} at ${loc.latitude}, ${loc.longitude} as invalid astronomy location`);
            return false;
          }
          
          // Then check SIQS
          return loc.siqs !== undefined && loc.siqs > 0;
        });
        
        setAllLocations(validLocations);
        setFilteredLocations(validLocations);
        setDisplayedLocations(validLocations.slice(0, maxInitialResults));
        setHasMoreLocations(validLocations.length > maxInitialResults);
        setCanLoadMoreCalculated(true); // Enable load more based on presence of locations
        setLoadMoreClickCount(0); // Reset click counter
      }
      
      // Update last search params
      setLastSearchParams(searchParams);
    } catch (error) {
      console.error("Error loading recommended locations:", error);
      toast.error(
        language === "en" ? "Error loading locations" : "加载位置时出错", 
        { description: language === "en" ? "Please try again later" : "请稍后再试" }
      );
    } finally {
      setSearching(false);
    }
  }, [userLocation, searchDistance, language, maxInitialResults, lastSearchParams]);
  
  // Load more calculated locations
  const loadMoreCalculatedLocations = useCallback(async () => {
    if (!userLocation || loadMoreClickCount >= MAX_LOAD_MORE_CLICKS) {
      return;
    }
    
    setSearching(true);
    console.log(`Loading more calculated locations, click ${loadMoreClickCount + 1} of ${MAX_LOAD_MORE_CLICKS}`);
    
    try {
      // Get more calculated locations
      const newCalculatedLocations = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        searchDistance,
        true, // Allow expanding radius
        MAX_CALCULATED_LOCATIONS // Get 10 more each time
      );
      
      // Filter out invalid locations
      const validNewLocations = newCalculatedLocations.filter(loc => {
        // Check for duplicates in existing locations
        const isDuplicate = allLocations.some(existing => 
          existing.latitude === loc.latitude && 
          existing.longitude === loc.longitude
        );
        
        if (isDuplicate) {
          return false;
        }
        
        // Check for water and SIQS
        return isValidAstronomyLocation(loc.latitude, loc.longitude, loc.name) && 
               loc.siqs !== undefined && loc.siqs > 0;
      });
      
      if (validNewLocations.length > 0) {
        // Combine with existing locations
        const combinedLocations = [...allLocations, ...validNewLocations];
        
        // Sort by distance
        combinedLocations.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        
        // Update state
        setAllLocations(combinedLocations);
        setFilteredLocations(combinedLocations);
        setDisplayedLocations(combinedLocations.slice(0, Math.max(displayedLocations.length, maxInitialResults) + validNewLocations.length));
        
        // Increment click counter
        setLoadMoreClickCount(prev => prev + 1);
        
        // Check if we've reached the maximum clicks
        if (loadMoreClickCount + 1 >= MAX_LOAD_MORE_CLICKS) {
          setCanLoadMoreCalculated(false);
          toast.info(
            language === "en" 
              ? "Maximum number of location requests reached" 
              : "已达到位置请求的最大数量",
            { 
              description: language === "en" 
                ? "To prevent overloading, no more locations can be loaded" 
                : "为防止超负荷，无法加载更多位置"
            }
          );
        }
        
        toast.success(
          language === "en" 
            ? `Added ${validNewLocations.length} more locations` 
            : `添加了${validNewLocations.length}个更多位置`,
          { 
            description: language === "en" 
              ? "Showing additional calculated viewing locations" 
              : "显示额外的计算观测位置"
          }
        );
      } else {
        toast.info(
          language === "en" 
            ? "No more unique locations found" 
            : "未找到更多独特位置",
          { 
            description: language === "en" 
              ? "Try increasing your search radius" 
              : "尝试增加您的搜索半径"
          }
        );
        
        // Disable load more if we can't find any new locations
        setCanLoadMoreCalculated(false);
      }
    } catch (error) {
      console.error("Error loading more calculated locations:", error);
      toast.error(
        language === "en" ? "Error loading additional locations" : "加载额外位置时出错", 
        { description: language === "en" ? "Please try again later" : "请稍后再试" }
      );
    } finally {
      setSearching(false);
    }
  }, [userLocation, searchDistance, language, allLocations, displayedLocations.length, maxInitialResults, loadMoreClickCount]);
  
  // Load locations when user location changes
  useEffect(() => {
    if (userLocation) {
      setLoading(true);
      loadRecommendedLocations(true).finally(() => {
        setLoading(false);
      });
    }
  }, [userLocation, loadRecommendedLocations]);
  
  // Determine if current user location has good viewing conditions
  useEffect(() => {
    if (!userLocation || currentSiqs === null) return;
    
    // Set threshold for "good" location
    const userHasGoodSiqs = currentSiqs >= 6.0; 
    setIsUserInGoodLocation(userHasGoodSiqs);
  }, [userLocation, currentSiqs]);
  
  // Load more locations from existing filteredLocations
  const loadMoreLocations = useCallback(() => {
    const currentCount = displayedLocations.length;
    const newLocations = filteredLocations.slice(0, currentCount + maxInitialResults);
    
    setDisplayedLocations(newLocations);
    setHasMoreLocations(filteredLocations.length > newLocations.length);
  }, [filteredLocations, displayedLocations.length, maxInitialResults]);
  
  // Enhanced search distance setter with validation
  const setValidatedSearchDistance = useCallback((distance: number) => {
    // Enforce maximum distance limit
    const validatedDistance = Math.min(Math.max(100, distance), MAX_SEARCH_DISTANCE);
    console.log(`Setting search distance to ${validatedDistance}km`);
    setSearchDistance(validatedDistance);
  }, []);
  
  // Function to refresh locations with current parameters
  const refreshLocations = useCallback(() => {
    if (!userLocation) return;
    
    console.log("Refreshing locations with current parameters");
    // Clear caches to ensure fresh data
    clearSiqsCache();
    clearLocationSearchCache();
    setLoadMoreClickCount(0); // Reset click counter on refresh
    loadRecommendedLocations(true);
  }, [userLocation, loadRecommendedLocations]);
  
  return {
    loading,
    searching,
    searchDistance,
    setSearchDistance: setValidatedSearchDistance,
    maxSearchDistance: MAX_SEARCH_DISTANCE,
    displayedLocations,
    hasMoreLocations,
    loadMoreLocations,
    isUserInGoodLocation,
    totalLocationsCount: filteredLocations.length,
    refreshLocations,
    canLoadMoreCalculated,
    loadMoreCalculatedLocations,
    loadMoreClickCount,
    maxLoadMoreClicks: MAX_LOAD_MORE_CLICKS,
    currentSiqs
  };
};

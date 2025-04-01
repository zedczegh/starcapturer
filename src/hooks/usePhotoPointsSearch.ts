
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

interface UsePhotoPointsSearchProps {
  userLocation: { latitude: number; longitude: number } | null;
  currentSiqs: number | null;
  maxInitialResults?: number;
}

// Maximum search distance
const MAX_SEARCH_DISTANCE = 10000; // 10,000 km

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
      
      // Find locations within radius
      const locations = await findLocationsWithinRadius(
        userLocation.latitude,
        userLocation.longitude,
        searchDistance,
        false // Get all locations, not just certified
      );
      
      if (locations.length === 0) {
        // If no locations found, try with calculated recommendations
        console.log("No standard locations found, trying calculated search");
        const calculatedLocations = await findCalculatedLocations(
          userLocation.latitude,
          userLocation.longitude,
          searchDistance,
          true // Allow expanding the search radius
        );
        
        if (calculatedLocations.length > 0) {
          // Filter out any locations with SIQS=0
          const validLocations = calculatedLocations.filter(loc => loc.siqs !== undefined && loc.siqs > 0);
          
          setAllLocations(validLocations);
          setFilteredLocations(validLocations);
          setDisplayedLocations(validLocations.slice(0, maxInitialResults));
          setHasMoreLocations(validLocations.length > maxInitialResults);
          
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
        const validLocations = locations.filter(loc => loc.siqs !== undefined && loc.siqs > 0);
        
        setAllLocations(validLocations);
        setFilteredLocations(validLocations);
        setDisplayedLocations(validLocations.slice(0, maxInitialResults));
        setHasMoreLocations(validLocations.length > maxInitialResults);
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
  
  // Load more locations
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
    refreshLocations
  };
};

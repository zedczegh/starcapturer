
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { calculateDistance } from "@/data/utils/distanceCalculator";
import { fetchWeatherData } from "@/lib/api";
import { fetchLightPollutionData } from "@/lib/api/pollution";
import { findBestViewingLocations, getFallbackLocations, clearSiqsCache } from "@/services/realTimeSiqsService";

interface UsePhotoPointsSearchProps {
  userLocation: { latitude: number; longitude: number } | null;
  currentSiqs: number | null;
  maxInitialResults?: number;
}

// Enhanced with higher max distance
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
      // Clear SIQS cache to ensure fresh calculations with radius change
      if (searchParams !== lastSearchParams) {
        clearSiqsCache();
      }
      
      // Find best viewing locations with real-time SIQS
      const recommendedLocations = await findBestViewingLocations(
        userLocation.latitude,
        userLocation.longitude,
        searchDistance,
        15 // Get up to 15 locations
      );
      
      if (recommendedLocations.length === 0 && searchDistance < MAX_SEARCH_DISTANCE) {
        // If no locations found, try with maximum radius as fallback
        console.log("No locations found, trying fallback search");
        const fallbackLocations = await getFallbackLocations(
          userLocation.latitude,
          userLocation.longitude,
          MAX_SEARCH_DISTANCE
        );
        
        if (fallbackLocations.length > 0) {
          setAllLocations(fallbackLocations);
          setFilteredLocations(fallbackLocations);
          setDisplayedLocations(fallbackLocations.slice(0, maxInitialResults));
          setHasMoreLocations(fallbackLocations.length > maxInitialResults);
          
          toast.info(
            language === "en" 
              ? "Expanded search radius to find locations" 
              : "扩大搜索半径以查找位置",
            { 
              description: language === "en" 
                ? "Showing the best available locations" 
                : "显示最佳可用位置"
            }
          );
        } else {
          setAllLocations([]);
          setFilteredLocations([]);
          setDisplayedLocations([]);
          setHasMoreLocations(false);
        }
      } else {
        // Process normal results
        setAllLocations(recommendedLocations);
        setFilteredLocations(recommendedLocations);
        setDisplayedLocations(recommendedLocations.slice(0, maxInitialResults));
        setHasMoreLocations(recommendedLocations.length > maxInitialResults);
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

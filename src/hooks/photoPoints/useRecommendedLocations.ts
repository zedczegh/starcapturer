
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { findLocationsWithinRadius } from "@/services/locationSearchService";
import { batchCalculateSiqs } from '@/services/realTimeSiqsService';
import { calculateDistance } from "@/data/utils/distanceCalculator";

// Maximum search distance
const MAX_SEARCH_DISTANCE = 10000; // 10,000 km
// Debounce delay for search
const SEARCH_DEBOUNCE_DELAY = 300; // milliseconds
// Number of initial results to display
const DEFAULT_INITIAL_RESULTS = 10;

interface RecommendedLocationsOptions {
  maxInitialResults?: number;
  preferCertified?: boolean;
}

/**
 * Hook to fetch and manage recommended photo point locations
 */
export const useRecommendedLocations = (
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number = 1000,
  maxInitialResults: number = DEFAULT_INITIAL_RESULTS
) => {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [allLocations, setAllLocations] = useState<SharedAstroSpot[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<SharedAstroSpot[]>([]);
  const [displayedLocations, setDisplayedLocations] = useState<SharedAstroSpot[]>([]);
  const [hasMoreLocations, setHasMoreLocations] = useState(false);
  
  const lastSearchParamsRef = useRef<string>('');
  const searchTimeoutRef = useRef<number | null>(null);
  const isFirstSearchRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Validated search radius setter
  const setSearchRadius = useCallback((distance: number) => {
    return Math.min(Math.max(100, distance), MAX_SEARCH_DISTANCE);
  }, []);
  
  // Load recommended locations based on user location and search radius
  const loadRecommendedLocations = useCallback(async (reset: boolean = true) => {
    if (!userLocation) return;
    
    // Generate search params signature
    const searchParams = `${userLocation.latitude.toFixed(5)}-${userLocation.longitude.toFixed(5)}-${searchRadius}`;
    
    // Skip if the same search was already performed (unless forced reset)
    if (!reset && searchParams === lastSearchParamsRef.current && !isFirstSearchRef.current) {
      return;
    }
    
    // Clear any previous search timeout
    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    // Cancel any in-progress fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    // Set a debounce delay before searching
    searchTimeoutRef.current = window.setTimeout(async () => {
      setSearching(true);
      
      try {
        // Find locations within radius
        const points = await findLocationsWithinRadius(
          userLocation.latitude,
          userLocation.longitude,
          searchRadius,
          false
        );
        
        if (points && points.length > 0) {
          // Calculate SIQS for locations
          const locationsWithSiqs = await batchCalculateSiqs(points);
          
          // Ensure all locations have distances calculated
          const locationsWithDistance = locationsWithSiqs.map(loc => {
            if (loc.distance === undefined) {
              return {
                ...loc,
                distance: calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  loc.latitude,
                  loc.longitude
                )
              };
            }
            return loc;
          });
          
          // Sort locations by certification, SIQS, and distance
          locationsWithDistance.sort((a, b) => {
            // First compare by certification status
            const aIsCertified = a.isDarkSkyReserve || a.certification;
            const bIsCertified = b.isDarkSkyReserve || b.certification;
            
            if (aIsCertified && !bIsCertified) return -1;
            if (!aIsCertified && bIsCertified) return 1;
            
            // If both have the same certification status, sort by SIQS
            const siqsA = typeof a.siqs === 'number' ? a.siqs : 0;
            const siqsB = typeof b.siqs === 'number' ? b.siqs : 0;
            
            if (siqsB !== siqsA) {
              return siqsB - siqsA;
            }
            
            // As last resort, sort by distance
            return (a.distance || Infinity) - (b.distance || Infinity);
          });
          
          // Update state with the results
          setAllLocations(locationsWithDistance);
          setFilteredLocations(locationsWithDistance);
          setDisplayedLocations(locationsWithDistance.slice(0, maxInitialResults));
          setHasMoreLocations(locationsWithDistance.length > maxInitialResults);
        } else {
          // No locations found
          setAllLocations([]);
          setFilteredLocations([]);
          setDisplayedLocations([]);
          setHasMoreLocations(false);
          
          toast.info(
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
        
        lastSearchParamsRef.current = searchParams;
        isFirstSearchRef.current = false;
      } catch (error) {
        // Ignore errors from aborted requests
        if (error.name !== 'AbortError') {
          console.error("Error loading recommended locations:", error);
          toast.error(
            language === "en" ? "Error loading locations" : "加载位置时出错", 
            { description: language === "en" ? "Please try again later" : "请稍后再试" }
          );
          
          // Set empty state
          setAllLocations([]);
          setFilteredLocations([]);
          setDisplayedLocations([]);
          setHasMoreLocations(false);
        }
      } finally {
        setSearching(false);
        searchTimeoutRef.current = null;
      }
    }, SEARCH_DEBOUNCE_DELAY);
    
  }, [userLocation, searchRadius, language, maxInitialResults]);
  
  // Initial fetch when userLocation changes
  useEffect(() => {
    if (userLocation) {
      isFirstSearchRef.current = true;
      loadRecommendedLocations(true);
    }
    
    // Cleanup timeouts and abort controller on unmount
    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [userLocation, loadRecommendedLocations]);
  
  // Update when search distance changes
  useEffect(() => {
    if (userLocation) {
      loadRecommendedLocations(false);
    }
  }, [searchRadius, loadRecommendedLocations, userLocation]);
  
  // Load more locations
  const loadMore = useCallback(() => {
    const currentCount = displayedLocations.length;
    const newLocations = filteredLocations.slice(0, currentCount + maxInitialResults);
    
    setDisplayedLocations(newLocations);
    setHasMoreLocations(filteredLocations.length > newLocations.length);
  }, [filteredLocations, displayedLocations.length, maxInitialResults]);
  
  // Function to refresh data
  const refreshSiqsData = useCallback(() => {
    if (!userLocation) return;
    
    toast.info(
      language === "en" 
        ? "Refreshing location data..." 
        : "正在刷新位置数据...",
      { 
        description: language === "en" 
          ? "Getting the latest SIQS and weather information" 
          : "获取最新的SIQS和天气信息"
      }
    );
    
    // Force a refresh with the current parameters
    isFirstSearchRef.current = true;
    loadRecommendedLocations(true);
  }, [userLocation, loadRecommendedLocations, language]);
  
  return {
    loading: loading || searching,
    displayedLocations,
    hasMore: hasMoreLocations,
    loadMore,
    refreshSiqsData,
    totalLocationsCount: filteredLocations.length,
    setSearchRadius
  };
};

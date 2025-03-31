
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { findLocationsWithinRadius } from "@/services/locationSearchService";
import { batchCalculateSiqs } from '@/services/realTimeSiqsService';
import { calculateDistance } from "@/data/utils/distanceCalculator";

// Debounce delay for search
const SEARCH_DEBOUNCE_DELAY = 300; // milliseconds

/**
 * Hook for location search functionality in the useRecommendedLocations hook
 */
export const useRecommendedLocationsSearch = (
  setLoading: (loading: boolean) => void,
  setSearching: (searching: boolean) => void,
  setAllLocations: (locations: SharedAstroSpot[]) => void,
  setFilteredLocations: (locations: SharedAstroSpot[]) => void,
  setDisplayedLocations: (locations: SharedAstroSpot[]) => void,
  setHasMoreLocations: (hasMore: boolean) => void,
  maxInitialResults: number,
  language: string
) => {
  const lastSearchParamsRef = useRef<string>('');
  const searchTimeoutRef = useRef<number | null>(null);
  const isFirstSearchRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  /**
   * Search for locations
   */
  const searchLocations = useCallback(async (
    userLocation: { latitude: number; longitude: number },
    searchRadius: number,
    reset: boolean = true
  ) => {
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
  }, [
    setSearching, 
    setAllLocations, 
    setFilteredLocations, 
    setDisplayedLocations, 
    setHasMoreLocations, 
    maxInitialResults, 
    language
  ]);
  
  /**
   * Abort any in-progress search
   */
  const abortCurrentSearch = useCallback(() => {
    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  
  return {
    searchLocations,
    abortCurrentSearch
  };
};

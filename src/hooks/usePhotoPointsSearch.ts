
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { 
  findLocationsWithinRadius, 
  findCalculatedLocations 
} from "@/services/locationSearchService";
import { clearSiqsCache, batchCalculateSiqs } from '@/services/realTimeSiqsService';
import { clearLocationSearchCache } from "@/services/locationCacheService";
import { clearAllEnvironmentalCaches } from "@/services/environmentalDataService";
import { calculateDistance } from "@/data/utils/distanceCalculator";

interface UsePhotoPointsSearchProps {
  userLocation: { latitude: number; longitude: number } | null;
  currentSiqs: number | null;
  maxInitialResults?: number;
}

// Maximum search distance
const MAX_SEARCH_DISTANCE = 10000; // 10,000 km
// Debounce delay for search
const SEARCH_DEBOUNCE_DELAY = 300; // milliseconds

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
  
  const lastSearchParamsRef = useRef<string>('');
  const searchTimeoutRef = useRef<number | null>(null);
  const isFirstSearchRef = useRef<boolean>(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Load recommended locations based on user location and search radius
  const loadRecommendedLocations = useCallback(async (reset: boolean = true) => {
    if (!userLocation) return;
    
    // Generate search params signature
    const searchParams = `${userLocation.latitude.toFixed(5)}-${userLocation.longitude.toFixed(5)}-${searchDistance}`;
    
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
        // Clear caches on major radius change
        if (Math.abs(parseInt(searchParams.split('-')[2]) - parseInt(lastSearchParamsRef.current.split('-')[2] || '0')) > 1000) {
          clearSiqsCache();
          clearLocationSearchCache();
          clearAllEnvironmentalCaches();
        }
        
        // Find certified locations first (usually smaller set)
        const certifiedLocations = await findLocationsWithinRadius(
          userLocation.latitude,
          userLocation.longitude,
          searchDistance,
          true // Get only certified
        );
        
        // Find calculated locations
        const calculatedLocations = await findCalculatedLocations(
          userLocation.latitude,
          userLocation.longitude,
          searchDistance,
          false // Don't expand radius automatically
        );
        
        // If we have no certified locations and no calculated locations,
        // try to find some with a more expensive search
        let expandedLocations: SharedAstroSpot[] = [];
        if (certifiedLocations.length === 0 && calculatedLocations.length === 0) {
          expandedLocations = await findCalculatedLocations(
            userLocation.latitude,
            userLocation.longitude,
            Math.min(searchDistance * 1.5, MAX_SEARCH_DISTANCE),
            true // Allow expanded search
          );
        }
        
        // Combine locations, ensuring no duplicates
        const certifiedCoords = new Set(
          certifiedLocations.map(loc => `${loc.latitude.toFixed(3)},${loc.longitude.toFixed(3)}`)
        );
        
        // Build combined list without duplicates
        let allLocations = [...certifiedLocations];
        
        // Add calculated locations that aren't duplicates
        calculatedLocations.forEach(calcLoc => {
          const coordKey = `${calcLoc.latitude.toFixed(3)},${calcLoc.longitude.toFixed(3)}`;
          if (!certifiedCoords.has(coordKey)) {
            allLocations.push(calcLoc);
          }
        });
        
        // Add expanded locations only if we have no other results
        if (allLocations.length === 0) {
          allLocations = expandedLocations;
        }
        
        // If we still have no locations, show error
        if (allLocations.length === 0) {
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
          
          setAllLocations([]);
          setFilteredLocations([]);
          setDisplayedLocations([]);
          setHasMoreLocations(false);
          lastSearchParamsRef.current = searchParams;
          isFirstSearchRef.current = false;
          return;
        }
        
        // Ensure all locations have distances calculated
        allLocations = allLocations.map(loc => {
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
        
        // Sort locations by type, SIQS, and distance
        allLocations.sort((a, b) => {
          // First compare by certification status
          const aIsCertified = a.isDarkSkyReserve || a.certification;
          const bIsCertified = b.isDarkSkyReserve || b.certification;
          
          if (aIsCertified && !bIsCertified) return -1;
          if (!aIsCertified && bIsCertified) return 1;
          
          // Then compare by distance
          const distA = typeof a.distance === 'number' ? a.distance : Infinity;
          const distB = typeof b.distance === 'number' ? b.distance : Infinity;
          
          if (distA !== distB) {
            return distA - distB;
          }
          
          // If same type and distance, compare by SIQS (if available)
          return (b.siqs || 0) - (a.siqs || 0);
        });
        
        // Calculate SIQS for closest locations first
        const nearbyLocations = allLocations.slice(0, 30); // Process first 30 locations
        const nearbyWithSiqs = await batchCalculateSiqs(nearbyLocations);
        
        // Update SIQS values in main array
        nearbyWithSiqs.forEach(locWithSiqs => {
          const idx = allLocations.findIndex(loc => 
            loc.id === locWithSiqs.id || 
            (loc.latitude === locWithSiqs.latitude && loc.longitude === locWithSiqs.longitude)
          );
          
          if (idx >= 0) {
            allLocations[idx].siqs = locWithSiqs.siqs;
            allLocations[idx].isViable = locWithSiqs.isViable;
          }
        });
        
        // Update state with the results
        setAllLocations(allLocations);
        setFilteredLocations(allLocations);
        setDisplayedLocations(allLocations.slice(0, maxInitialResults));
        setHasMoreLocations(allLocations.length > maxInitialResults);
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
    
  }, [userLocation, searchDistance, language, maxInitialResults]);
  
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
  }, [searchDistance, loadRecommendedLocations, userLocation]);
  
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
    
    // Load SIQS for next batch of locations in background
    const nextBatchToProcess = filteredLocations.slice(
      currentCount + maxInitialResults, 
      currentCount + (maxInitialResults * 2)
    );
    
    if (nextBatchToProcess.length > 0) {
      batchCalculateSiqs(nextBatchToProcess).then(locsWithSiqs => {
        // Update SIQS values in filtered locations
        setFilteredLocations(prev => {
          const updated = [...prev];
          locsWithSiqs.forEach(locWithSiqs => {
            const idx = updated.findIndex(loc => 
              loc.id === locWithSiqs.id || 
              (loc.latitude === locWithSiqs.latitude && loc.longitude === locWithSiqs.longitude)
            );
            
            if (idx >= 0) {
              updated[idx].siqs = locWithSiqs.siqs;
              updated[idx].isViable = locWithSiqs.isViable;
            }
          });
          return updated;
        });
      }).catch(err => {
        console.error("Error calculating SIQS for next batch:", err);
      });
    }
  }, [filteredLocations, displayedLocations.length, maxInitialResults]);
  
  // Enhanced search distance setter with validation and debouncing
  const setValidatedSearchDistance = useCallback((distance: number) => {
    // Enforce maximum distance limit
    const validatedDistance = Math.min(Math.max(100, distance), MAX_SEARCH_DISTANCE);
    setSearchDistance(validatedDistance);
  }, []);
  
  // Function to refresh locations with current parameters
  const refreshLocations = useCallback(() => {
    if (!userLocation) return;
    
    // Clear caches to ensure fresh data
    clearSiqsCache();
    clearLocationSearchCache();
    clearAllEnvironmentalCaches();
    
    // Force reset
    isFirstSearchRef.current = true;
    loadRecommendedLocations(true);
    
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
  }, [userLocation, loadRecommendedLocations, language]);
  
  // Set loading false when search completes
  useEffect(() => {
    if (!searching && loading) {
      setLoading(false);
    }
  }, [searching, loading]);
  
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

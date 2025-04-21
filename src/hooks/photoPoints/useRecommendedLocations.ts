import { useState, useEffect, useCallback, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLocationFind } from './useLocationFind';
import { useCalculatedLocationsFind } from './useCalculatedLocationsFind';
import { useLanguage } from '@/contexts/LanguageContext';
import { currentSiqsStore } from '@/components/index/CalculatorSection'; 
import { isWaterLocation } from '@/utils/validation';
import { toast } from '@/components/ui/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

interface Location {
  latitude: number;
  longitude: number;
}

// Maximum locations to display regardless of radius
const MAX_LOCATIONS = 20;

const DEFAULT_CALCULATED_RADIUS = 100;
const DEFAULT_CERTIFIED_RADIUS = 10000;

export const useRecommendedLocations = (
  userLocation: Location | null,
  initialRadius: number = DEFAULT_CALCULATED_RADIUS
) => {
  const { t } = useLanguage();
  const [searchRadius, setSearchRadius] = useState<number>(initialRadius);
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [error, setError] = useState<Error | null>(null);
  const prevRadiusRef = useRef<number>(searchRadius);
  const prevLocationRef = useRef<Location | null>(userLocation);
  const previousLocationsRef = useRef<SharedAstroSpot[]>([]);
  
  const [canLoadMoreCalculated, setCanLoadMoreCalculated] = useState<boolean>(false);
  
  const currentSiqs = currentSiqsStore.getValue();
  
  const { findLocationsWithinRadius, sortLocationsByQuality } = useLocationFind();
  const { findCalculatedLocations } = useCalculatedLocationsFind();
  
  // Debounce radius changes to prevent excessive API calls
  const debouncedRadius = useDebounce(searchRadius, 500);
  
  const loadLocations = useCallback(async () => {
    if (!userLocation) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const isRadiusIncrease = searchRadius > prevRadiusRef.current && 
                               prevLocationRef.current && 
                               userLocation.latitude === prevLocationRef.current.latitude &&
                               userLocation.longitude === prevLocationRef.current.longitude;
      
      const locationChanged = !prevLocationRef.current ||
        Math.abs(userLocation.latitude - prevLocationRef.current.latitude) > 0.001 ||
        Math.abs(userLocation.longitude - prevLocationRef.current.longitude) > 0.001;
      
      prevRadiusRef.current = searchRadius;
      prevLocationRef.current = userLocation;
      
      console.log(`Loading locations within ${searchRadius}km of ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}, preserving: ${isRadiusIncrease && !locationChanged}`);
      
      // Always get certified locations - these are typically pre-calculated and fewer in number
      const certifiedResults = await findLocationsWithinRadius(
        userLocation.latitude,
        userLocation.longitude,
        DEFAULT_CERTIFIED_RADIUS
      );
      
      // For calculated locations, we implement intelligent sampling based on radius
      // Larger radius = more sparse sampling to avoid overloading
      const samplingDensity = Math.max(1, Math.floor(searchRadius / 100));
      const calculatedLimit = Math.ceil(MAX_LOCATIONS / samplingDensity);
      
      const calculatedResults = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius,
        calculatedLimit // Fix: Remove the extra 'true' parameter
      );
      
      const filteredCalculatedResults = calculatedResults
        .filter(loc => !isWaterLocation(loc.latitude, loc.longitude))
        // Take at most MAX_LOCATIONS minus the number of certified locations
        .slice(0, Math.max(0, MAX_LOCATIONS - certifiedResults.length));
      
      const combinedResults = [...certifiedResults, ...filteredCalculatedResults];
      
      if (combinedResults.length === 0) {
        console.log("No locations found within the search radius");
        setLocations([]);
        previousLocationsRef.current = [];
        setHasMore(false);
        setCanLoadMoreCalculated(false);
      } else {
        const sortedResults = sortLocationsByQuality(combinedResults);
        setLocations(sortedResults);
        previousLocationsRef.current = sortedResults;
        setHasMore(sortedResults.length >= MAX_LOCATIONS);
        setCanLoadMoreCalculated(filteredCalculatedResults.length > 0);
      }
      
      setPage(1);
    } catch (error) {
      console.error("Error loading recommended locations:", error);
      setError(error instanceof Error ? error : new Error("Failed to load locations"));
      toast({
        variant: "destructive",
        title: t(
          "Failed to load recommended locations",
          "加载推荐位置失败"
        ),
        description: t(
          "Please try again.",
          "请重试。"
        )
      });
      setLocations([]);
      setHasMore(false);
      setCanLoadMoreCalculated(false);
    } finally {
      setLoading(false);
    }
  }, [searchRadius, userLocation, t, findLocationsWithinRadius, findCalculatedLocations, sortLocationsByQuality]);
  
  const loadMore = useCallback(async () => {
    if (!userLocation || !hasMore) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const nextPage = page + 1;
      
      // When loading more, get another batch with appropriate limits
      const results = await findLocationsWithinRadius(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius,
        MAX_LOCATIONS
      );
      
      const filteredResults = results.filter(loc => 
        loc.isDarkSkyReserve || loc.certification || !isWaterLocation(loc.latitude, loc.longitude)
      );
      
      const existingIds = new Set(locations.map(loc => loc.id));
      const newResults = filteredResults.filter(loc => !existingIds.has(loc.id));
      
      if (newResults.length > 0) {
        // Limit total to MAX_LOCATIONS
        const allLocations = [...locations, ...newResults].slice(0, MAX_LOCATIONS);
        const sortedResults = sortLocationsByQuality(allLocations);
        
        setLocations(sortedResults);
        previousLocationsRef.current = sortedResults;
        setHasMore(newResults.length >= 5 && sortedResults.length < MAX_LOCATIONS);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more locations:", error);
      setError(error instanceof Error ? error : new Error("Failed to load more locations"));
      toast({
        variant: "destructive",
        title: t(
          "Failed to load more locations",
          "加载更多位置失败"
        ),
        description: t(
          "Please try again.",
          "请重试。"
        )
      });
    } finally {
      setLoading(false);
    }
  }, [hasMore, locations, page, searchRadius, userLocation, t, findLocationsWithinRadius, sortLocationsByQuality]);
  
  const loadMoreCalculatedLocations = useCallback(async () => {
    if (!userLocation) {
      return;
    }
    
    try {
      setSearching(true);
      setError(null);
      console.log(`Loading more calculated locations`);
      
      // For calculated locations, we use intelligent sampling based on radius
      const samplingDensity = Math.max(1, Math.floor(searchRadius / 100));
      const calculatedLimit = Math.ceil(MAX_LOCATIONS / samplingDensity);
      
      const calculatedResults = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius,
        calculatedLimit // Updated to match the new parameter list
      );
      
      const filteredResults = calculatedResults.filter(loc => 
        !isWaterLocation(loc.latitude, loc.longitude)
      );
      
      const existingCoords = new Set(locations.map(loc => 
        `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`
      ));
      
      const newResults = filteredResults.filter(loc => {
        const coordKey = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
        return !existingCoords.has(coordKey);
      });
      
      if (newResults.length > 0) {
        // Limit total combined results to MAX_LOCATIONS
        const allLocations = [...locations, ...newResults].slice(0, MAX_LOCATIONS);
        const sortedResults = sortLocationsByQuality(allLocations);
        
        setLocations(sortedResults);
        previousLocationsRef.current = sortedResults;
        
        toast({
          title: t(
            `Added ${newResults.length} more locations`,
            `添加了${newResults.length}个更多位置`
          )
        });
        
        // Can load more if we didn't reach the maximum locations
        setCanLoadMoreCalculated(sortedResults.length < MAX_LOCATIONS);
      } else {
        toast({
          title: t(
            "No more unique locations found",
            "未找到更多独特位置"
          )
        });
        
        setCanLoadMoreCalculated(false);
      }
    } catch (error) {
      console.error("Error loading more calculated locations:", error);
      setError(error instanceof Error ? error : new Error("Failed to load more calculated locations"));
      toast({
        variant: "destructive",
        title: t(
          "Failed to load more locations",
          "加载更多位置失败"
        )
      });
    } finally {
      setSearching(false);
    }
  }, [locations, searchRadius, t, userLocation, findCalculatedLocations, sortLocationsByQuality]);
  
  const refreshSiqsData = useCallback(async () => {
    if (!userLocation) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await loadLocations();
    } catch (error) {
      console.error("Error refreshing SIQS data:", error);
      setError(error instanceof Error ? error : new Error("Failed to refresh data"));
      toast({
        variant: "destructive",
        title: t(
          "Failed to refresh location data",
          "刷新位置数据失败"
        )
      });
    } finally {
      setLoading(false);
    }
  }, [loadLocations, userLocation, t]);
  
  // Use debounced radius to prevent excessive API calls
  useEffect(() => {
    const radiusChanged = debouncedRadius !== prevRadiusRef.current;
    const locationChanged = 
      (userLocation && !prevLocationRef.current) ||
      (!userLocation && prevLocationRef.current) ||
      (userLocation && prevLocationRef.current && 
        (Math.abs(userLocation.latitude - prevLocationRef.current.latitude) > 0.001 || 
         Math.abs(userLocation.longitude - prevLocationRef.current.longitude) > 0.001));
    
    if (userLocation && (radiusChanged || locationChanged)) {
      loadLocations();
    }
  }, [debouncedRadius, userLocation, loadLocations]);
  
  return {
    searchRadius,
    setSearchRadius,
    locations,
    loading,
    searching,
    hasMore,
    loadMore,
    refreshSiqsData,
    canLoadMoreCalculated,
    loadMoreCalculatedLocations,
    error,
    currentSiqs
  };
};

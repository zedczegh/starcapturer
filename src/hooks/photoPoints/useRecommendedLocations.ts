import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useLocationFind } from './useLocationFind';
import { useCalculatedLocationsFind } from './useCalculatedLocationsFind';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { currentSiqsStore } from '@/components/index/CalculatorSection'; 

interface Location {
  latitude: number;
  longitude: number;
}

// Maximum number of "load more" clicks allowed
const MAX_LOAD_MORE_CLICKS = 2;

export const useRecommendedLocations = (userLocation: Location | null) => {
  const { t } = useLanguage();
  const [searchRadius, setSearchRadius] = useState<number>(1000);
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const prevRadiusRef = useRef<number>(searchRadius);
  const prevLocationRef = useRef<Location | null>(userLocation);
  const previousLocationsRef = useRef<SharedAstroSpot[]>([]);
  
  // New state for "load more calculated" functionality
  const [canLoadMoreCalculated, setCanLoadMoreCalculated] = useState<boolean>(false);
  const [loadMoreClickCount, setLoadMoreClickCount] = useState<number>(0);
  
  // Get current SIQS score from the store
  const currentSiqs = currentSiqsStore.getScore();
  
  // Extract location finding logic with parallel processing
  const { findLocationsWithinRadius, sortLocationsByQuality } = useLocationFind();
  const { findCalculatedLocations } = useCalculatedLocationsFind();
  
  // Function to load locations with optimized parallel processing
  const loadLocations = useCallback(async () => {
    if (!userLocation) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if this is a radius increase (we should preserve locations)
      const isRadiusIncrease = searchRadius > prevRadiusRef.current && 
                               prevLocationRef.current && 
                               userLocation.latitude === prevLocationRef.current.latitude &&
                               userLocation.longitude === prevLocationRef.current.longitude;
      
      // Record the current radius and location for comparison
      prevRadiusRef.current = searchRadius;
      prevLocationRef.current = userLocation;
      
      console.log(`Loading locations within ${searchRadius}km of ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}, preserving: ${isRadiusIncrease}`);
      
      // Store previous locations if we're increasing radius
      let existingLocations: SharedAstroSpot[] = [];
      if (isRadiusIncrease) {
        existingLocations = [...previousLocationsRef.current];
        console.log(`Preserving ${existingLocations.length} existing locations`);
      }
      
      // Perform parallel API calls for faster loading
      const [existingResults, calculatedResults] = await Promise.all([
        // Get existing database locations
        findLocationsWithinRadius(
          userLocation.latitude,
          userLocation.longitude,
          searchRadius
        ),
        // Simultaneously find calculated locations
        findCalculatedLocations(
          userLocation.latitude,
          userLocation.longitude,
          Math.min(searchRadius * 1.5, 10000),
          true, // Allow expansion
          10,  // Limit
          isRadiusIncrease, // Preserve previous locations if radius increased
          existingLocations
        )
      ]);
      
      // Combine all results, ensuring we don't have duplicates
      let combinedResults: SharedAstroSpot[] = [];
      
      // Add existing database results
      if (existingResults.length > 0) {
        combinedResults = [...existingResults];
      }
      
      // Add calculated results, ensuring no duplicates by coordinates
      if (calculatedResults.length > 0) {
        const existingCoords = new Set(combinedResults.map(loc => 
          `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`
        ));
        
        calculatedResults.forEach(loc => {
          const coordKey = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
          if (!existingCoords.has(coordKey)) {
            combinedResults.push(loc);
            existingCoords.add(coordKey);
          }
        });
      }
      
      // If we're increasing radius, make sure we're preserving previous locations
      if (isRadiusIncrease && existingLocations.length > 0) {
        const existingCoords = new Set(combinedResults.map(loc => 
          `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`
        ));
        
        existingLocations.forEach(loc => {
          const coordKey = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
          if (!existingCoords.has(coordKey)) {
            combinedResults.push(loc);
            existingCoords.add(coordKey);
          }
        });
      }
      
      // Sort by quality and distance
      const sortedResults = sortLocationsByQuality(combinedResults);
      setLocations(sortedResults);
      previousLocationsRef.current = sortedResults;
      setHasMore(sortedResults.length >= 20);
      setCanLoadMoreCalculated(true);
      setLoadMoreClickCount(0); // Reset click counter
      
      // If we preserved locations, show a notification
      if (isRadiusIncrease && existingLocations.length > 0) {
        toast.info(t(
          "Search radius increased, previous locations preserved",
          "搜索半径已增加，保留了之前的位置"
        ));
      }
      
      setPage(1);
    } catch (error) {
      console.error("Error loading recommended locations:", error);
      toast.error(t(
        "Failed to load recommended locations. Please try again.",
        "加载推荐位置失败。请重试。"
      ));
      
      // On error, still keep existing locations
      if (previousLocationsRef.current.length > 0) {
        setLocations(previousLocationsRef.current);
      } else {
        setLocations([]);
      }
      
      setHasMore(false);
      setCanLoadMoreCalculated(false);
    } finally {
      setLoading(false);
    }
  }, [searchRadius, userLocation, t, findLocationsWithinRadius, findCalculatedLocations, sortLocationsByQuality]);
  
  // Load more locations for pagination
  const loadMore = useCallback(async () => {
    if (!userLocation || !hasMore) {
      return;
    }
    
    try {
      setLoading(true);
      const nextPage = page + 1;
      
      // Get more locations
      const results = await findLocationsWithinRadius(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius
      );
      
      // Filter out locations we already have
      const existingIds = new Set(locations.map(loc => loc.id));
      const newResults = results.filter(loc => !existingIds.has(loc.id));
      
      if (newResults.length > 0) {
        // Sort by quality and distance
        const allLocations = [...locations, ...newResults];
        const sortedResults = sortLocationsByQuality(allLocations);
        
        setLocations(sortedResults);
        previousLocationsRef.current = sortedResults;
        setHasMore(newResults.length >= 10);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more locations:", error);
      toast.error(t(
        "Failed to load more locations. Please try again.",
        "加载更多位置失败。请重试。"
      ));
    } finally {
      setLoading(false);
    }
  }, [hasMore, locations, page, searchRadius, userLocation, t, findLocationsWithinRadius, sortLocationsByQuality]);
  
  // Load more calculated locations (new function)
  const loadMoreCalculatedLocations = useCallback(async () => {
    if (!userLocation || loadMoreClickCount >= MAX_LOAD_MORE_CLICKS) {
      return;
    }
    
    try {
      setSearching(true);
      console.log(`Loading more calculated locations, click ${loadMoreClickCount + 1} of ${MAX_LOAD_MORE_CLICKS}`);
      
      // Get more calculated locations, preserving existing ones
      const calculatedResults = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius,
        true, // Allow radius expansion
        10, // Get 10 more locations
        true, // Always preserve previous locations
        locations // Pass current locations
      );
      
      // Filter out locations we already have
      const existingCoords = new Set(locations.map(loc => 
        `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`
      ));
      
      const newResults = calculatedResults.filter(loc => {
        const coordKey = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
        return !existingCoords.has(coordKey);
      });
      
      if (newResults.length > 0) {
        // Sort by quality and distance
        const allLocations = [...locations, ...newResults];
        const sortedResults = sortLocationsByQuality(allLocations);
        
        setLocations(sortedResults);
        previousLocationsRef.current = sortedResults;
        
        // Increment click counter
        const newClickCount = loadMoreClickCount + 1;
        setLoadMoreClickCount(newClickCount);
        
        // Check if we've reached the limit
        if (newClickCount >= MAX_LOAD_MORE_CLICKS) {
          setCanLoadMoreCalculated(false);
        }
        
        toast.success(t(
          `Added ${newResults.length} more locations`,
          `添加了${newResults.length}个更多位置`
        ));
      } else {
        toast.info(t(
          "No more unique locations found",
          "未找到更多独特位置"
        ));
        
        // Disable button if we can't find more locations
        setCanLoadMoreCalculated(false);
      }
    } catch (error) {
      console.error("Error loading more calculated locations:", error);
      toast.error(t(
        "Failed to load more locations",
        "加载更多位置失败"
      ));
    } finally {
      setSearching(false);
    }
  }, [loadMoreClickCount, locations, searchRadius, t, userLocation, findCalculatedLocations, sortLocationsByQuality]);
  
  // Refresh SIQS data for locations
  const refreshSiqsData = useCallback(async () => {
    if (!userLocation || locations.length === 0) {
      return;
    }
    
    try {
      toast.info(t(
        "Refreshing location data...",
        "正在刷新位置数据..."
      ));
      
      setLoading(true);
      
      // Load fresh data
      await loadLocations();
      
      toast.success(t(
        "Location data refreshed successfully",
        "位置数据刷新成功"
      ));
    } catch (error) {
      console.error("Error refreshing SIQS data:", error);
      toast.error(t(
        "Failed to refresh location data",
        "刷新位置数据失败"
      ));
    } finally {
      setLoading(false);
    }
  }, [loadLocations, locations.length, userLocation, t]);
  
  // Load locations when userLocation or searchRadius changes
  useEffect(() => {
    // Check if we need to reload based on radius or location change
    const radiusChanged = searchRadius !== prevRadiusRef.current;
    const locationChanged = 
      (userLocation && !prevLocationRef.current) ||
      (!userLocation && prevLocationRef.current) ||
      (userLocation && prevLocationRef.current && 
        (userLocation.latitude !== prevLocationRef.current.latitude || 
         userLocation.longitude !== prevLocationRef.current.longitude));
    
    if (userLocation && (radiusChanged || locationChanged)) {
      loadLocations();
    }
  }, [loadLocations, searchRadius, userLocation]);
  
  return {
    searchRadius,
    setSearchRadius,
    locations,
    loading,
    searching,
    hasMore,
    loadMore,
    refreshSiqsData,
    // New properties for load more calculated functionality
    canLoadMoreCalculated,
    loadMoreCalculatedLocations,
    loadMoreClickCount,
    maxLoadMoreClicks: MAX_LOAD_MORE_CLICKS,
    currentSiqs // Add currentSiqs to the return value
  };
};

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { useLocationFind } from './useLocationFind';
import { useCalculatedLocationsFind } from './useCalculatedLocationsFind';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { currentSiqsStore } from '@/components/index/CalculatorSection'; 
import { getPollutionCacheStats, cleanupExpiredPollutionCache } from '@/lib/api/pollution';

interface Location {
  latitude: number;
  longitude: number;
}

// Maximum number of "load more" clicks allowed
const MAX_LOAD_MORE_CLICKS = 2;

// Enhanced with geo-clustering algorithm to find diverse locations
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
  
  // Optimization: Track loaded coordinates to prevent duplicates
  const loadedCoordinatesRef = useRef<Set<string>>(new Set());
  
  // New state for "load more calculated" functionality
  const [canLoadMoreCalculated, setCanLoadMoreCalculated] = useState<boolean>(false);
  const [loadMoreClickCount, setLoadMoreClickCount] = useState<number>(0);
  
  // Get current SIQS from the store
  const currentSiqs = currentSiqsStore.getValue();
  
  // Extract location finding logic
  const { findLocationsWithinRadius, sortLocationsByQuality } = useLocationFind();
  const { findCalculatedLocations } = useCalculatedLocationsFind();
  
  // Optimized implementation to track coordinates to avoid duplicates
  const addToLoadedCoordinates = useCallback((newLocations: SharedAstroSpot[]) => {
    newLocations.forEach(loc => {
      if (loc.latitude && loc.longitude) {
        loadedCoordinatesRef.current.add(
          `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`
        );
      }
    });
  }, []);
  
  // Clear loaded coordinates when location changes significantly
  const clearLoadedCoordinates = useCallback(() => {
    loadedCoordinatesRef.current.clear();
  }, []);
  
  // Check if a location already exists in our loaded set
  const isLocationLoaded = useCallback((loc: SharedAstroSpot): boolean => {
    if (!loc.latitude || !loc.longitude) return false;
    return loadedCoordinatesRef.current.has(
      `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`
    );
  }, []);
  
  // Perform geo-clustering to ensure diverse location selection
  const clusterLocations = useCallback((locations: SharedAstroSpot[], maxClusters = 20): SharedAstroSpot[] => {
    if (locations.length <= maxClusters) return locations;
    
    // Simple grid-based clustering for performance
    const clustered: SharedAstroSpot[] = [];
    const gridSize = 0.5; // Degrees, roughly 50km at mid-latitudes
    const grid: Record<string, SharedAstroSpot[]> = {};
    
    // Group locations into grid cells
    locations.forEach(loc => {
      if (!loc.latitude || !loc.longitude) return;
      
      const gridKey = `${Math.floor(loc.latitude / gridSize)}_${Math.floor(loc.longitude / gridSize)}`;
      if (!grid[gridKey]) grid[gridKey] = [];
      grid[gridKey].push(loc);
    });
    
    // Take the best location from each grid cell
    Object.values(grid).forEach(cellLocations => {
      if (cellLocations.length === 0) return;
      
      // Sort by quality (SIQS score) within each cell
      const sorted = [...cellLocations].sort((a, b) => (b.siqs || 0) - (a.siqs || 0));
      clustered.push(sorted[0]);
    });
    
    // Sort final results by quality
    return clustered.sort((a, b) => (b.siqs || 0) - (a.siqs || 0))
      .slice(0, maxClusters);
  }, []);
  
  // Function to load locations with optimizations
  const loadLocations = useCallback(async () => {
    if (!userLocation) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Clean up expired cache entries to keep memory usage efficient
      cleanupExpiredPollutionCache();
      
      // Check if this is a radius increase (we should preserve locations)
      const isRadiusIncrease = searchRadius > prevRadiusRef.current && 
                               prevLocationRef.current && 
                               userLocation.latitude === prevLocationRef.current.latitude &&
                               userLocation.longitude === prevLocationRef.current.longitude;
      
      // If location changed significantly, clear our coordinate tracking
      const locationChanged = 
        !prevLocationRef.current || 
        Math.abs(userLocation.latitude - prevLocationRef.current.latitude) > 0.1 ||
        Math.abs(userLocation.longitude - prevLocationRef.current.longitude) > 0.1;
      
      if (locationChanged) {
        clearLoadedCoordinates();
      }
      
      // Record the current radius and location for comparison
      prevRadiusRef.current = searchRadius;
      prevLocationRef.current = userLocation;
      
      console.log(`Loading locations within ${searchRadius}km of ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}, preserving: ${isRadiusIncrease}`);
      
      // Get all locations within radius
      const results = await findLocationsWithinRadius(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius
      );
      
      if (results.length === 0) {
        console.log("No locations found, trying to find calculated locations...");
        // If no results at all, try to find some calculated locations
        const calculatedResults = await findCalculatedLocations(
          userLocation.latitude,
          userLocation.longitude,
          Math.min(searchRadius * 1.5, 10000)
        );
        
        if (calculatedResults.length > 0) {
          // Filter out any locations we've already loaded
          const newLocations = calculatedResults.filter(loc => !isLocationLoaded(loc));
          
          // Perform clustering for better diversity
          const clusteredResults = clusterLocations([
            ...(isRadiusIncrease ? previousLocationsRef.current : []),
            ...newLocations
          ]);
          
          // Sort by quality and distance
          const sortedResults = sortLocationsByQuality(clusteredResults);
          
          // Track the coordinates we've loaded
          addToLoadedCoordinates(newLocations);
          
          setLocations(sortedResults);
          previousLocationsRef.current = sortedResults;
          setHasMore(newLocations.length >= 5);
          setCanLoadMoreCalculated(true);
          setLoadMoreClickCount(0); // Reset click counter
          
          // If we preserved locations, show a notification
          if (isRadiusIncrease && previousLocationsRef.current.length > 0) {
            toast.info(t(
              "Search radius increased, previous locations preserved",
              "搜索半径已增加，保留了之前的位置"
            ));
          }
        } else {
          setLocations([]);
          previousLocationsRef.current = [];
          setHasMore(false);
          setCanLoadMoreCalculated(false);
        }
      } else {
        // For standard locations, we always apply the full algorithm
        // Filter out any locations we've already loaded if it's not a fresh search
        const filteredResults = locationChanged ? 
          results : 
          results.filter(loc => !isLocationLoaded(loc));
        
        // Add the new coordinates to our tracking
        addToLoadedCoordinates(filteredResults);
        
        // Perform clustering for better diversity
        const clusteredResults = clusterLocations([
          ...(isRadiusIncrease ? previousLocationsRef.current : []),
          ...filteredResults
        ]);
        
        // Sort by quality and distance
        const sortedResults = sortLocationsByQuality(clusteredResults);
        
        setLocations(sortedResults);
        previousLocationsRef.current = sortedResults;
        setHasMore(filteredResults.length >= 5);
        setCanLoadMoreCalculated(true);
        setLoadMoreClickCount(0); // Reset click counter
      }
      
      setPage(1);
    } catch (error) {
      console.error("Error loading recommended locations:", error);
      toast.error(t(
        "Failed to load recommended locations. Please try again.",
        "加载推荐位置失败。请重试。"
      ));
      setLocations([]);
      setHasMore(false);
      setCanLoadMoreCalculated(false);
    } finally {
      setLoading(false);
    }
  }, [
    searchRadius, 
    userLocation, 
    t, 
    findLocationsWithinRadius, 
    findCalculatedLocations, 
    sortLocationsByQuality,
    addToLoadedCoordinates,
    clearLoadedCoordinates,
    isLocationLoaded,
    clusterLocations
  ]);
  
  // Load more locations for pagination with performance improvements
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
        searchRadius,
        nextPage
      );
      
      // Filter out locations we already have
      const newResults = results.filter(loc => !isLocationLoaded(loc));
      
      if (newResults.length > 0) {
        // Track the new coordinates
        addToLoadedCoordinates(newResults);
        
        // Sort by quality and distance
        const allLocations = [...locations, ...newResults];
        const sortedResults = sortLocationsByQuality(allLocations);
        
        setLocations(sortedResults);
        previousLocationsRef.current = sortedResults;
        setHasMore(newResults.length >= 5);
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
  }, [
    hasMore, 
    locations, 
    page, 
    searchRadius, 
    userLocation, 
    t, 
    findLocationsWithinRadius, 
    sortLocationsByQuality,
    addToLoadedCoordinates,
    isLocationLoaded
  ]);
  
  // Load more calculated locations with optimized duplicate detection
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
        searchRadius
      );
      
      // Filter out locations we've already loaded
      const newResults = calculatedResults.filter(loc => !isLocationLoaded(loc));
      
      if (newResults.length > 0) {
        // Update tracking of loaded coordinates
        addToLoadedCoordinates(newResults);
        
        // Sort by quality and distance with clustering for diversity
        const allLocations = [...locations, ...newResults];
        const clusteredLocations = clusterLocations(allLocations);
        const sortedResults = sortLocationsByQuality(clusteredLocations);
        
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
  }, [
    loadMoreClickCount, 
    locations, 
    searchRadius, 
    t, 
    userLocation, 
    findCalculatedLocations, 
    sortLocationsByQuality,
    addToLoadedCoordinates,
    isLocationLoaded,
    clusterLocations
  ]);
  
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
      
      // Clear loaded coordinates cache to force fresh data
      clearLoadedCoordinates();
      
      // Load fresh data
      await loadLocations();
      
      // Show cache stats after refresh
      const stats = getPollutionCacheStats();
      console.log(`Pollution cache: ${stats.size} entries, avg age: ${stats.averageAge}s`);
      
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
  }, [
    loadLocations, 
    locations.length, 
    userLocation, 
    t,
    clearLoadedCoordinates
  ]);
  
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

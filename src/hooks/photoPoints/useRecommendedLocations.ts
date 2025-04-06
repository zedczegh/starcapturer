
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useCache } from '@/hooks/useCache';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useCalculatedLocations } from './useCalculatedLocations';
import { calculateDistance } from '@/lib/api/utils';

interface UseRecommendedLocationsProps {
  userLatitude?: number;
  userLongitude?: number;
  maxDistance?: number;
  filterType?: 'all' | 'certified' | 'calculated';
  maxResults?: number;
  initialBatchSize?: number;
  loadMoreIncrement?: number;
}

/**
 * Enhanced hook for managing recommended astrophotography locations
 * with improved algorithms and performance
 */
export function useRecommendedLocations({
  userLatitude,
  userLongitude,
  maxDistance = 1000,
  filterType = 'all',
  maxResults = 50,
  initialBatchSize = 5,
  loadMoreIncrement = 5
}: UseRecommendedLocationsProps) {
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [searchRadius, setSearchRadius] = useState<number>(maxDistance);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadMoreClickCount, setLoadMoreClickCount] = useState(0);
  const [maxLoadMoreClicks] = useState(5);
  const [displayCount, setDisplayCount] = useState(initialBatchSize);
  
  // Track if component is mounted to avoid state updates after unmount
  const isMountedRef = useRef(true);
  const lastSearchParamsRef = useRef<string>('');
  
  // Cache for optimized performance
  const { getItem, setItem } = useCache();
  
  // Access the calculated locations functionality
  const { findCalculatedLocations, calculating } = useCalculatedLocations({
    qualityThreshold: 3.5, // Minimum quality threshold for calculated locations
    maxLocationsPerBatch: maxResults
  });
  
  // Combined loading state
  const isLoading = loading || calculating;
  
  // Reset state when user location changes
  useEffect(() => {
    if (userLatitude && userLongitude) {
      const currentSearchParams = `${userLatitude.toFixed(4)},${userLongitude.toFixed(4)},${searchRadius}`;
      
      // Only reload if parameters have changed
      if (currentSearchParams !== lastSearchParamsRef.current) {
        lastSearchParamsRef.current = currentSearchParams;
        setLoading(true);
        setLocations([]);
        setDisplayCount(initialBatchSize);
        setHasMore(true);
        setLoadMoreClickCount(0);
        
        // Small delay to prevent UI flicker
        setTimeout(() => {
          if (isMountedRef.current) {
            searchLocations();
          }
        }, 100);
      }
    }
  }, [userLatitude, userLongitude, searchRadius]);
  
  // Enhanced location search with optimized batching
  const searchLocations = useCallback(async () => {
    if (!userLatitude || !userLongitude) {
      setLoading(false);
      return;
    }
    
    try {
      setSearching(true);
      
      // Generate cache key based on search parameters
      const cacheKey = `recommendedLocs-${userLatitude.toFixed(4)}-${userLongitude.toFixed(4)}-${searchRadius}`;
      
      // Try to get from cache first
      const cachedData = getItem<{
        locations: SharedAstroSpot[];
        timestamp: number;
      }>(cacheKey);
      
      let locationsData: SharedAstroSpot[] = [];
      
      // Use cache if available and not older than 12 hours
      const maxCacheAge = 12 * 60 * 60 * 1000; // 12 hours
      const useCachedData = cachedData && 
                            (Date.now() - cachedData.timestamp < maxCacheAge) &&
                            cachedData.locations.length > 0;
      
      if (useCachedData) {
        locationsData = cachedData.locations;
        console.log(`Using ${locationsData.length} cached locations`);
      } else {
        // First get certified dark sky locations from API
        try {
          const { fetchDarkSkyLocations } = await import('@/lib/api/astroSpots');
          const darkSkyLocations = await fetchDarkSkyLocations();
          
          // Process and filter locations
          if (darkSkyLocations && darkSkyLocations.length > 0) {
            // Add distance to each location
            const withDistance = darkSkyLocations.map(loc => {
              if (!loc.latitude || !loc.longitude) {
                return {
                  ...loc,
                  distance: Infinity
                };
              }
              
              const distance = calculateDistance(
                userLatitude, 
                userLongitude, 
                loc.latitude, 
                loc.longitude
              );
              
              return { 
                ...loc,
                distance
              };
            });
            
            // Filter by distance
            locationsData = withDistance.filter(loc => 
              loc.distance <= searchRadius
            );
            
            console.log(`Found ${locationsData.length} dark sky locations within ${searchRadius}km`);
          }
        } catch (error) {
          console.error("Error fetching dark sky locations:", error);
        }
        
        // Then add calculated locations
        if (filterType !== 'certified') {
          try {
            // Find algorithmically calculated good locations
            const calculatedLocs = await findCalculatedLocations(
              userLatitude,
              userLongitude,
              searchRadius,
              true, // Allow expansion if needed
              maxResults - locationsData.length,
              true, // Preserve existing locations
              locationsData // Pass existing locations to avoid duplicates
            );
            
            locationsData = calculatedLocs;
            
            console.log(`Added calculated locations, total: ${locationsData.length}`);
          } catch (error) {
            console.error("Error finding calculated locations:", error);
          }
        }
        
        // Sort by optimal viewing conditions and distance
        locationsData = locationsData.sort((a, b) => {
          // Prefer certified locations
          if (a.certification && !b.certification) return -1;
          if (!a.certification && b.certification) return 1;
          
          // Then by SIQS quality
          if ((a.siqs || 0) !== (b.siqs || 0)) {
            return (b.siqs || 0) - (a.siqs || 0);
          }
          
          // Then by proximity
          return (a.distance || 0) - (b.distance || 0);
        });
        
        // Limit results
        locationsData = locationsData.slice(0, maxResults);
        
        // Cache the results for future use
        setItem(cacheKey, {
          locations: locationsData,
          timestamp: Date.now()
        });
      }
      
      // Apply filters if needed
      if (filterType === 'certified') {
        locationsData = locationsData.filter(loc => Boolean(loc.certification));
      } else if (filterType === 'calculated') {
        locationsData = locationsData.filter(loc => !loc.certification);
      }
      
      // Update state if component is still mounted
      if (isMountedRef.current) {
        setLocations(locationsData);
        setHasMore(locationsData.length >= displayCount);
      }
    } catch (error) {
      console.error("Error searching for locations:", error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setSearching(false);
      }
    }
  }, [userLatitude, userLongitude, searchRadius, displayCount, filterType, getItem, setItem, findCalculatedLocations]);
  
  // Update display count when locations change
  useEffect(() => {
    setDisplayCount(Math.min(initialBatchSize, locations.length));
  }, [locations, initialBatchSize]);
  
  // Refresh SIQS data for existing locations
  const refreshSiqsData = useCallback(async () => {
    if (locations.length === 0) return;
    
    try {
      setLoading(true);
      
      // Batch update SIQS for all locations
      const { batchCalculateSiqs } = await import('@/services/realTimeSiqsService');
      const updatedLocations = await batchCalculateSiqs(locations);
      
      if (isMountedRef.current) {
        setLocations(updatedLocations);
      }
    } catch (error) {
      console.error("Error refreshing SIQS data:", error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [locations]);
  
  // Function to load more results
  const loadMore = useCallback(() => {
    // Update the display count to show more items
    setDisplayCount(prev => Math.min(prev + loadMoreIncrement, locations.length));
    setLoadMoreClickCount(prev => prev + 1);
    setHasMore(displayCount + loadMoreIncrement < locations.length);
  }, [loadMoreIncrement, locations.length, displayCount]);
  
  // Load more calculated locations specifically
  const loadMoreCalculatedLocations = useCallback(async () => {
    if (!userLatitude || !userLongitude) return;
    
    try {
      setLoading(true);
      
      // Find more calculated locations
      const calculatedLocs = await findCalculatedLocations(
        userLatitude,
        userLongitude,
        searchRadius,
        true,
        maxResults * 2, // Get more this time
        true, // Keep existing
        locations // Pass existing locations to avoid duplicates
      );
      
      if (isMountedRef.current) {
        setLocations(calculatedLocs);
        setDisplayCount(prev => Math.min(prev + loadMoreIncrement, calculatedLocs.length));
        setLoadMoreClickCount(prev => prev + 1);
        setHasMore(displayCount + loadMoreIncrement < calculatedLocs.length);
      }
    } catch (error) {
      console.error("Error loading more calculated locations:", error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [userLatitude, userLongitude, searchRadius, locations, findCalculatedLocations, displayCount, loadMoreIncrement]);
  
  // Determine if we can load more calculated locations
  const canLoadMoreCalculated = useMemo(() => {
    return loadMoreClickCount < maxLoadMoreClicks;
  }, [loadMoreClickCount, maxLoadMoreClicks]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  return {
    locations: locations.slice(0, displayCount),
    allLocations: locations,
    loading: isLoading,
    searching,
    hasMore,
    searchRadius,
    setSearchRadius,
    loadMore,
    refreshSiqsData,
    loadMoreCalculatedLocations,
    canLoadMoreCalculated,
    loadMoreClickCount,
    maxLoadMoreClicks
  };
}


import { useState, useEffect, useCallback } from 'react';
import { useCache } from '@/hooks/useCache';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { fetchDarkSkyLocations } from '@/lib/api/darkSkyLocations';
import { batchCalculateSiqs } from '@/services/realTimeSiqsService';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseRecommendedLocationsProps {
  userLatitude?: number | null;
  userLongitude?: number | null;
  maxDistance?: number;
  filterType?: 'all' | 'certified' | 'calculated';
  maxResults?: number;
}

/**
 * Enhanced hook to fetch and manage recommended dark sky locations
 * with real-time SIQS calculation and pagination support
 */
export function useRecommendedLocations(props?: UseRecommendedLocationsProps) {
  const {
    userLatitude,
    userLongitude,
    maxDistance = 1000,
    filterType = 'all',
    maxResults = 20
  } = props || {};
  
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [searchRadius, setSearchRadius] = useState(maxDistance);
  const [hasMore, setHasMore] = useState(false);
  const [loadMoreClickCount, setLoadMoreClickCount] = useState(0);
  const [canLoadMoreCalculated, setCanLoadMoreCalculated] = useState(false);
  const cache = useCache<SharedAstroSpot[]>(30 * 60 * 1000); // 30 minute cache
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Maximum number of "load more" clicks allowed
  const maxLoadMoreClicks = 5;
  
  useEffect(() => {
    let mounted = true;
    
    const fetchLocations = async () => {
      // Generate cache key based on user location and search radius
      const cacheKey = userLatitude && userLongitude 
        ? `locations-${userLatitude.toFixed(2)}-${userLongitude.toFixed(2)}-${searchRadius}`
        : 'recommended-locations';
      
      const cachedData = cache.getItem(cacheKey);
      
      if (cachedData) {
        setLocations(cachedData);
        // Check if we might have more locations to load
        setHasMore(cachedData.length >= maxResults);
        setCanLoadMoreCalculated(cachedData.length >= maxResults);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch dark sky locations from API
        const data = await fetchDarkSkyLocations();
        
        if (!mounted) return;
        
        // Filter locations by distance if user location is available
        let filteredLocations = data;
        if (userLatitude && userLongitude) {
          filteredLocations = data.filter(location => {
            // Calculate distance using Haversine formula
            const distance = calculateDistance(
              userLatitude, userLongitude,
              location.latitude, location.longitude
            );
            
            // Store distance for sorting
            location.distance = distance;
            return distance <= searchRadius;
          });
          
          // Sort by distance
          filteredLocations.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }
        
        // Limit results
        const limitedLocations = filteredLocations.slice(0, maxResults);
        
        // Calculate real-time SIQS for each location
        const locationsWithSiqs = await batchCalculateSiqs(limitedLocations);
        
        if (mounted) {
          // Sort by SIQS score (highest first)
          const sortedLocations = locationsWithSiqs.sort((a, b) => 
            (b.siqs || 0) - (a.siqs || 0)
          );
          
          setLocations(sortedLocations);
          cache.setItem(cacheKey, sortedLocations);
          
          // Check if we might have more locations to load
          setHasMore(filteredLocations.length > limitedLocations.length);
          setCanLoadMoreCalculated(filteredLocations.length > limitedLocations.length);
        }
      } catch (err) {
        if (mounted) {
          console.error("Error fetching recommended locations:", err);
          setError(err instanceof Error ? err : new Error('Unknown error'));
          
          // Show error toast
          toast({
            title: t ? t("Error loading locations", "加载位置时出错") : "Error loading locations",
            description: t ? t("Could not load recommended locations. Please try again later.", 
                            "无法加载推荐位置。请稍后再试。") : 
                          "Could not load recommended locations. Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchLocations();
    
    return () => {
      mounted = false;
    };
  }, [cache, toast, t, userLatitude, userLongitude, searchRadius, maxResults]);
  
  /**
   * Load more locations
   */
  const loadMore = useCallback(async () => {
    if (!userLatitude || !userLongitude || loading || !hasMore) return;
    
    setSearching(true);
    
    try {
      // Generate cache key for additional locations
      const nextPage = loadMoreClickCount + 1;
      const cacheKey = `locations-${userLatitude.toFixed(2)}-${userLongitude.toFixed(2)}-${searchRadius}-page-${nextPage}`;
      
      const cachedData = cache.getItem(cacheKey);
      
      if (cachedData) {
        setLocations(prev => [...prev, ...cachedData]);
        setLoadMoreClickCount(nextPage);
        setHasMore(nextPage < maxLoadMoreClicks && cachedData.length >= maxResults);
        setCanLoadMoreCalculated(nextPage < maxLoadMoreClicks && cachedData.length >= maxResults);
        setSearching(false);
        return;
      }
      
      // Fetch more locations
      const allLocations = await fetchDarkSkyLocations();
      
      // Filter by distance
      const filteredLocations = allLocations.filter(location => {
        const distance = calculateDistance(
          userLatitude, userLongitude,
          location.latitude, location.longitude
        );
        
        location.distance = distance;
        return distance <= searchRadius;
      });
      
      // Sort by distance
      filteredLocations.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      // Skip locations we already have
      const skip = maxResults * (nextPage);
      const additionalLocations = filteredLocations.slice(skip, skip + maxResults);
      
      // Calculate SIQS for additional locations
      const locationsWithSiqs = await batchCalculateSiqs(additionalLocations);
      
      // Add to existing locations
      setLocations(prev => [...prev, ...locationsWithSiqs]);
      
      // Cache the additional locations
      cache.setItem(cacheKey, locationsWithSiqs);
      
      // Update state
      setLoadMoreClickCount(nextPage);
      setHasMore(nextPage < maxLoadMoreClicks && additionalLocations.length >= maxResults);
      setCanLoadMoreCalculated(nextPage < maxLoadMoreClicks && additionalLocations.length >= maxResults);
      
    } catch (error) {
      console.error("Error loading more locations:", error);
      toast({
        title: t ? t("Error loading more locations", "加载更多位置时出错") : "Error loading more locations",
        description: t ? t("Could not load additional locations. Please try again.", 
                        "无法加载更多位置。请重试。") : 
                      "Could not load additional locations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  }, [userLatitude, userLongitude, loading, hasMore, loadMoreClickCount, searchRadius, maxResults, cache, t, toast]);
  
  /**
   * Load more calculated locations
   */
  const loadMoreCalculatedLocations = useCallback(async () => {
    // Similar implementation to loadMore but focused on calculated locations
    console.log("Loading more calculated locations...");
    return loadMore();
  }, [loadMore]);
  
  /**
   * Refresh SIQS data for all locations
   */
  const refreshSiqsData = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      // Clear cache to force fresh data
      if (userLatitude && userLongitude) {
        cache.removeItem(`locations-${userLatitude.toFixed(2)}-${userLongitude.toFixed(2)}-${searchRadius}`);
      } else {
        cache.removeItem('recommended-locations');
      }
      
      // Calculate fresh SIQS for all locations
      const locationsWithSiqs = await batchCalculateSiqs(locations);
      
      // Update with fresh data
      setLocations(locationsWithSiqs);
      
      // Show success toast
      toast({
        title: t ? t("SIQS data refreshed", "SIQS数据已刷新") : "SIQS data refreshed",
        description: t ? t("Latest sky quality scores loaded with current conditions.", 
                        "已加载具有当前条件的最新天空质量分数。") : 
                      "Latest sky quality scores loaded with current conditions.",
      });
    } catch (error) {
      console.error("Error refreshing SIQS data:", error);
      toast({
        title: t ? t("Refresh failed", "刷新失败") : "Refresh failed",
        description: t ? t("Could not refresh sky quality scores. Please try again.", 
                        "无法刷新天空质量分数。请重试。") : 
                      "Could not refresh sky quality scores. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [loading, locations, userLatitude, userLongitude, searchRadius, cache, t, toast]);
  
  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  function calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  }
  
  function deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  /**
   * Refresh locations data
   */
  const refreshLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Clear cache to force fresh data
      if (userLatitude && userLongitude) {
        cache.removeItem(`locations-${userLatitude.toFixed(2)}-${userLongitude.toFixed(2)}-${searchRadius}`);
      } else {
        cache.removeItem('recommended-locations');
      }
      
      // Fetch fresh data
      const data = await fetchDarkSkyLocations();
      
      // Filter locations by distance if user location is available
      let filteredLocations = data;
      if (userLatitude && userLongitude) {
        filteredLocations = data.filter(location => {
          const distance = calculateDistance(
            userLatitude, userLongitude,
            location.latitude, location.longitude
          );
          
          location.distance = distance;
          return distance <= searchRadius;
        });
        
        filteredLocations.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
      
      // Limit results
      const limitedLocations = filteredLocations.slice(0, maxResults);
      
      // Calculate SIQS for locations
      const locationsWithSiqs = await batchCalculateSiqs(limitedLocations);
      
      // Sort by SIQS score (highest first)
      const sortedLocations = locationsWithSiqs.sort((a, b) => 
        (b.siqs || 0) - (a.siqs || 0)
      );
      
      setLocations(sortedLocations);
      
      // Cache the locations
      const cacheKey = userLatitude && userLongitude 
        ? `locations-${userLatitude.toFixed(2)}-${userLongitude.toFixed(2)}-${searchRadius}`
        : 'recommended-locations';
      cache.setItem(cacheKey, sortedLocations);
      
      // Update pagination state
      setHasMore(filteredLocations.length > limitedLocations.length);
      setCanLoadMoreCalculated(filteredLocations.length > limitedLocations.length);
      setLoadMoreClickCount(0);
      
      // Show success toast
      toast({
        title: t ? t("Locations refreshed", "位置已刷新") : "Locations refreshed",
        description: t ? t("Latest dark sky locations loaded with current conditions.", 
                        "已加载最新的暗空位置和当前条件。") : 
                      "Latest dark sky locations loaded with current conditions.",
      });
    } catch (err) {
      console.error("Error refreshing locations:", err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      
      // Show error toast
      toast({
        title: t ? t("Refresh failed", "刷新失败") : "Refresh failed",
        description: t ? t("Could not refresh locations. Please try again later.", 
                        "无法刷新位置。请稍后再试。") : 
                      "Could not refresh locations. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userLatitude, userLongitude, searchRadius, maxResults, cache, t, toast]);
  
  return {
    locations,
    loading,
    error,
    refreshLocations,
    searchRadius,
    setSearchRadius,
    searching,
    hasMore,
    loadMore,
    refreshSiqsData,
    canLoadMoreCalculated,
    loadMoreCalculatedLocations,
    loadMoreClickCount,
    maxLoadMoreClicks
  };
}

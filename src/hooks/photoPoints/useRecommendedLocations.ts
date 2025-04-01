
import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { 
  findLocationsWithinRadius, 
  findCertifiedLocations, 
  findCalculatedLocations,
  sortLocationsByQuality
} from '@/services/locationSearchService';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';

interface Location {
  latitude: number;
  longitude: number;
}

export const useRecommendedLocations = (userLocation: Location | null) => {
  const { t } = useLanguage();
  const [searchRadius, setSearchRadius] = useState<number>(1000);
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const prevRadiusRef = useRef<number>(searchRadius);
  const prevLocationRef = useRef<Location | null>(userLocation);
  
  // Function to load locations
  const loadLocations = useCallback(async () => {
    if (!userLocation) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Record the current radius and location for comparison
      prevRadiusRef.current = searchRadius;
      prevLocationRef.current = userLocation;
      
      console.log(`Loading locations within ${searchRadius}km of ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`);
      
      // Get all locations within radius
      const results = await findLocationsWithinRadius(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius
      );
      
      if (results.length === 0) {
        console.log("No locations found, trying to expand search...");
        // If no results at all, try to find some certified locations
        const certifiedResults = await findCertifiedLocations(
          userLocation.latitude,
          userLocation.longitude,
          Math.min(searchRadius * 1.5, 10000)
        );
        
        // And also try to find calculated locations
        const calculatedResults = await findCalculatedLocations(
          userLocation.latitude,
          userLocation.longitude,
          Math.min(searchRadius * 1.5, 10000)
        );
        
        // Combine results
        const combinedResults = [...certifiedResults, ...calculatedResults];
        
        if (combinedResults.length > 0) {
          // Sort by quality and distance
          const sortedResults = sortLocationsByQuality(combinedResults);
          setLocations(sortedResults);
          setHasMore(sortedResults.length >= 20);
        } else {
          setLocations([]);
          setHasMore(false);
        }
      } else {
        // Sort by quality and distance
        const sortedResults = sortLocationsByQuality(results);
        setLocations(sortedResults);
        setHasMore(sortedResults.length >= 20);
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
    } finally {
      setLoading(false);
    }
  }, [searchRadius, userLocation, t]);
  
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
  }, [hasMore, locations, page, searchRadius, userLocation, t]);
  
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
    hasMore,
    loadMore,
    refreshSiqsData
  };
};

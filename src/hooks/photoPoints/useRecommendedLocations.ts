
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { findBestViewingLocations, batchCalculateSiqs, clearSiqsCache } from '@/services/realTimeSiqsService';

/**
 * Hook to handle recommended locations with real-time SIQS data
 */
export function useRecommendedLocations(initialUserLocation?: { latitude: number; longitude: number } | null) {
  const { t } = useLanguage();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    initialUserLocation || null
  );
  const [searchRadius, setSearchRadius] = useState<number>(2000);
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [showCertifiedOnly, setShowCertifiedOnly] = useState<boolean>(false);
  const [lastSearchParams, setLastSearchParams] = useState<string>('');

  /**
   * Load locations based on current parameters
   */
  const loadLocations = useCallback(async (reset: boolean = false) => {
    if (!userLocation) return;
    
    // Generate search params signature
    const searchParams = `${userLocation.latitude.toFixed(5)}-${userLocation.longitude.toFixed(5)}-${searchRadius}-${page}-${showCertifiedOnly}`;
    
    // Skip if the same search was already performed (unless forced reset)
    if (!reset && searchParams === lastSearchParams) {
      return;
    }
    
    setLoading(true);
    console.log(`Loading locations with radius: ${searchRadius}km, page: ${page}, reset: ${reset}`);
    
    try {
      // Calculate current page for API query
      const currentPage = reset ? 1 : page;
      const limit = 9; // Number of items per page
      
      // Clear SIQS cache when radius changes to ensure fresh data
      if (searchRadius !== parseInt(lastSearchParams.split('-')[2], 10)) {
        clearSiqsCache();
      }
      
      // Use optimized algorithm for finding locations with best viewing conditions
      const points = await findBestViewingLocations(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius,
        limit * currentPage, // Get all results up to current page
        showCertifiedOnly
      );
      
      console.log(`Found ${points.length} locations within ${searchRadius}km radius`);
      
      // Update state with fetched locations
      if (reset) {
        setLocations(points);
        setPage(1);
      } else {
        // Avoid duplicates when loading more
        const existingIds = new Set(locations.map(loc => loc.id));
        const newPoints = points.filter(point => !existingIds.has(point.id));
        setLocations(prev => [...prev, ...newPoints]);
      }
      
      // Determine if more locations might be available
      setHasMore(points.length >= limit * currentPage);
      
      // Update last search params
      setLastSearchParams(searchParams);
    } catch (error) {
      console.error("Error loading recommended locations:", error);
      toast.error(
        t("Failed to load locations", "加载位置失败"),
        { description: t("Please try again later", "请稍后再试") }
      );
    } finally {
      setLoading(false);
    }
  }, [userLocation, searchRadius, page, showCertifiedOnly, locations, lastSearchParams, t]);

  /**
   * Handle location change
   */
  useEffect(() => {
    if (userLocation) {
      loadLocations(true);
    }
  }, [userLocation, loadLocations]);

  /**
   * Handle radius change
   */
  const handleRadiusChange = useCallback((radius: number) => {
    console.log(`Radius changed to ${radius}km`);
    setSearchRadius(radius);
    // Immediately load locations when radius changes
    setPage(1); // Reset to page 1
  }, []);

  /**
   * Apply radius change and trigger reload
   * This is a separate function that will be called after slider interaction ends
   */
  const applyRadiusChange = useCallback(() => {
    loadLocations(true);
  }, [loadLocations]);

  /**
   * Toggle between certified and all locations
   */
  const toggleCertifiedOnly = useCallback(() => {
    setShowCertifiedOnly(prev => !prev);
    setPage(1); // Reset to page 1
    loadLocations(true);
  }, [loadLocations]);

  /**
   * Load more locations
   */
  const loadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  /**
   * Refresh locations with latest SIQS data
   */
  const refreshSiqsData = useCallback(async () => {
    if (locations.length === 0) {
      loadLocations(true);
      return;
    }
    
    setLoading(true);
    try {
      // Clear cache to ensure fresh SIQS calculations
      clearSiqsCache();
      
      // Recalculate SIQS for all locations
      const updatedLocations = await batchCalculateSiqs(locations);
      setLocations(updatedLocations);
      
      toast.success(
        t("SIQS data refreshed", "SIQS 数据已刷新"),
        { description: t("Showing latest viewing conditions", "显示最新观测条件") }
      );
    } catch (error) {
      console.error("Error refreshing SIQS data:", error);
    } finally {
      setLoading(false);
    }
  }, [locations, loadLocations, t]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      loadLocations();
    }
  }, [page, loadLocations]);

  return {
    userLocation,
    setUserLocation,
    searchRadius,
    setSearchRadius: handleRadiusChange,
    applyRadiusChange,
    locations,
    loading,
    hasMore,
    loadMore,
    showCertifiedOnly,
    toggleCertifiedOnly,
    refreshSiqsData
  };
}

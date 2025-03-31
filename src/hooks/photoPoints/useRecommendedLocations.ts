
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getRecommendedPhotoPoints } from '@/lib/api';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { findBestViewingLocations, batchCalculateSiqs } from '@/services/realTimeSiqsService';

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
  const [radiusChanged, setRadiusChanged] = useState<boolean>(false);
  const [lastSearchParams, setLastSearchParams] = useState<string>('');

  /**
   * Load locations based on current parameters
   */
  const loadLocations = useCallback(async (reset: boolean = false) => {
    if (!userLocation) return;
    
    // Generate search params signature
    const searchParams = `${userLocation.latitude.toFixed(5)}-${userLocation.longitude.toFixed(5)}-${searchRadius}-${page}-${showCertifiedOnly}`;
    
    // Skip if the same search was already performed (unless radius changed)
    if (!reset && searchParams === lastSearchParams && !radiusChanged) {
      return;
    }
    
    setLoading(true);
    setRadiusChanged(false);
    
    try {
      // Calculate current page for API query
      const currentPage = reset ? 1 : page;
      const limit = 9; // Number of items per page
      
      // Use optimized algorithm for finding locations with best viewing conditions
      const points = await findBestViewingLocations(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius,
        limit * currentPage // Get all results up to current page
      );
      
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
  }, [userLocation, searchRadius, page, showCertifiedOnly, locations, lastSearchParams, radiusChanged, t]);

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
    setSearchRadius(radius);
    setRadiusChanged(true);
  }, []);

  /**
   * Apply radius change and trigger reload
   */
  const applyRadiusChange = useCallback(() => {
    if (radiusChanged) {
      loadLocations(true);
    }
  }, [radiusChanged, loadLocations]);

  /**
   * Toggle between certified and all locations
   */
  const toggleCertifiedOnly = useCallback(() => {
    setShowCertifiedOnly(prev => !prev);
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

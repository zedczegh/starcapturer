
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { findCalculatedLocations } from '@/services/locationSearchService';
import { batchCalculateSiqs } from '@/services/realTimeSiqs/batchProcessor';

interface UseRecommendedLocationsProps {
  userLocation?: { latitude: number; longitude: number } | null;
  initialRadius?: number;
}

export const useRecommendedLocations = (
  userLocation?: { latitude: number; longitude: number } | null,
  initialRadius: number = 100
) => {
  const { t } = useLanguage();
  const [searchRadius, setSearchRadius] = useState(initialRadius);
  const [maxResults, setMaxResults] = useState(50);
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loadMoreClickCount, setLoadMoreClickCount] = useState(0);
  const [maxLoadMoreClicks, setMaxLoadMoreClicks] = useState(3);
  
  const maxDiscoveries = 20;
  const canLoadMoreCalculated = loadMoreClickCount < maxLoadMoreClicks;
  
  // Fetch data when user location changes
  useEffect(() => {
    if (userLocation) {
      fetchLocations();
    }
  }, [userLocation]);
  
  // Fetch locations based on user location and search radius
  const fetchLocations = useCallback(async () => {
    if (!userLocation) return;
    
    setLoading(true);
    setInitialLoad(false);
    
    try {
      // Get locations from service
      const locationsData = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius
      );
      
      setLocations(locationsData);
      setHasMore(locationsData.length >= maxResults);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      toast.error(t('Failed to fetch nearby locations', '获取附近位置失败'));
    } finally {
      setLoading(false);
    }
  }, [userLocation, searchRadius, maxResults, t]);
  
  // Load more locations
  const loadMore = useCallback(async () => {
    if (!userLocation || !hasMore || loading) return;
    
    setSearching(true);
    
    try {
      // Get more locations with increased radius
      const expandedRadius = searchRadius * 1.5;
      const additionalLocations = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        expandedRadius
      );
      
      // Filter out duplicates
      const existingIds = new Set(locations.map(loc => `${loc.latitude}-${loc.longitude}`));
      
      const newLocations = additionalLocations.filter(loc => 
        !existingIds.has(`${loc.latitude}-${loc.longitude}`)
      );
      
      setLocations(prev => [...prev, ...newLocations]);
      setHasMore(newLocations.length > 0);
    } catch (error) {
      console.error('Failed to load more locations:', error);
      toast.error(t('Failed to load more locations', '加载更多位置失败'));
    } finally {
      setSearching(false);
    }
  }, [userLocation, hasMore, loading, searchRadius, locations, t]);
  
  // Refresh SIQS data for locations
  const refreshSiqsData = useCallback(async () => {
    if (!locations.length) return;
    
    try {
      const locationsToUpdate = locations.slice(0, 5);
      
      // Update SIQS scores
      const results = await batchCalculateSiqs(
        locationsToUpdate.map(loc => ({ 
          latitude: loc.latitude, 
          longitude: loc.longitude, 
          bortleScale: loc.bortleScale 
        }))
      );
      
      // Update locations with new SIQS data
      const updatedLocations = locations.map((loc, index) => {
        if (index < 5) {
          return {
            ...loc,
            siqs: results[index]
          };
        }
        return loc;
      });
      
      setLocations(updatedLocations);
    } catch (error) {
      console.error('Failed to refresh SIQS data:', error);
    }
  }, [locations]);
  
  // Load more calculated locations
  const loadMoreCalculatedLocations = useCallback(async () => {
    if (!canLoadMoreCalculated || !userLocation) return;
    
    setLoadMoreClickCount(prev => prev + 1);
    setLoading(true);
    
    try {
      const expandedRadius = searchRadius * (1 + loadMoreClickCount);
      
      // Get locations from service with expanded radius
      const additionalLocations = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        expandedRadius,
        maxResults
      );
      
      // Filter out duplicates
      const existingIds = new Set(locations.map(loc => `${loc.latitude}-${loc.longitude}`));
      
      const newLocations = additionalLocations.filter(loc => 
        !existingIds.has(`${loc.latitude}-${loc.longitude}`)
      );
      
      // Merge with existing locations
      setLocations(prev => [...prev, ...newLocations]);
      
      // Update search radius for future queries
      setSearchRadius(expandedRadius);
    } catch (error) {
      console.error('Failed to load more calculated locations:', error);
      toast.error(t('Failed to load more locations', '加载更多位置失败'));
    } finally {
      setLoading(false);
    }
  }, [canLoadMoreCalculated, userLocation, searchRadius, loadMoreClickCount, maxResults, locations, t]);
  
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
    loadMoreClickCount,
    maxLoadMoreClicks,
    maxDiscoveries,
    findCalculatedLocations: useCallback((lat: number, lng: number, radius: number) => {
      return findCalculatedLocations(lat, lng, radius);
    }, [])
  };
};

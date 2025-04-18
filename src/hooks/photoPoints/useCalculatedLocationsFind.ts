
/**
 * Hook for managing calculated locations
 */
import { useCallback } from 'react';
import { useRecommendedLocationsFix } from './useRecommendedLocationsFix';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/utils/geoUtils';
import { toast } from 'sonner';
import { isSiqsAtLeast } from '@/utils/siqsHelpers';
import { isValidAstronomyLocation } from '@/utils/locationValidator';

export const useCalculatedLocationsFind = () => {
  const { 
    userLocation,
    searchRadius,
    maxResults,
    fetchRecommendations,
    fetchMoreLocations,
    loading,
    searching,
    maxDiscoveries,
    canLoadMore,
    loadMoreClickCount,
    maxLoadMoreClicks,
    locationsData
  } = useRecommendedLocationsFix();

  /**
   * Filter locations by SIQS threshold
   */
  const getQualityLocations = useCallback((
    locations: SharedAstroSpot[],
    threshold: number = 6
  ): SharedAstroSpot[] => {
    if (!locations) return [];
    
    return locations.filter(loc => {
      // Always include certified locations
      if (loc.isDarkSkyReserve || loc.certification) return true;
      
      // For other locations, check SIQS threshold and validity
      return loc.siqs && 
        isSiqsAtLeast(loc.siqs, threshold) && 
        isValidAstronomyLocation(loc.latitude, loc.longitude);
    });
  }, []);

  /**
   * Sort locations by distance from user
   */
  const sortByDistance = useCallback((locations: SharedAstroSpot[]): SharedAstroSpot[] => {
    if (!locations || !userLocation) return locations || [];
    
    return [...locations].sort((a, b) => {
      const distA = a.distance || calculateDistance(
        userLocation.latitude, userLocation.longitude, 
        a.latitude, a.longitude
      );
      const distB = b.distance || calculateDistance(
        userLocation.latitude, userLocation.longitude, 
        b.latitude, b.longitude
      );
      return distA - distB;
    });
  }, [userLocation]);

  /**
   * Handle load more button click
   */
  const handleLoadMore = useCallback(async () => {
    if (!userLocation) {
      toast.error("No location selected");
      return;
    }
    
    if (!canLoadMore) {
      toast.info("No more locations available");
      return;
    }
    
    await fetchMoreLocations();
  }, [fetchMoreLocations, canLoadMore, userLocation]);

  return {
    userLocation,
    searchRadius,
    maxResults,
    fetchRecommendations,
    loading,
    searching,
    maxDiscoveries,
    canLoadMore,
    loadMoreClickCount,
    maxLoadMoreClicks,
    getQualityLocations,
    sortByDistance,
    handleLoadMore,
    locationsData
  };
};

export default useCalculatedLocationsFind;

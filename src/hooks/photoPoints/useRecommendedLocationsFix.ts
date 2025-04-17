
import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { findCalculatedLocations } from '@/services/locationSearchService';

interface UseRecommendedLocationsFixProps {
  userLocation?: { latitude: number; longitude: number } | null;
  initialRadius?: number;
}

export const useRecommendedLocationsFix = (props?: UseRecommendedLocationsFixProps) => {
  const { t } = useLanguage();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(props?.userLocation || null);
  const [searchRadius, setSearchRadius] = useState<number>(props?.initialRadius || 100);
  const [maxResults, setMaxResults] = useState<number>(50);
  const [locationsData, setLocationsData] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [maxDiscoveries, setMaxDiscoveries] = useState<number>(5);
  const [loadMoreClickCount, setLoadMoreClickCount] = useState<number>(0);
  const [maxLoadMoreClicks, setMaxLoadMoreClicks] = useState<number>(3);
  
  const canLoadMore = loadMoreClickCount < maxLoadMoreClicks;
  
  // Fetch recommendations
  const fetchRecommendations = useCallback(async () => {
    if (!userLocation) {
      toast.error(t("No location selected", "未选择位置"));
      return;
    }
    
    setLoading(true);
    try {
      const calculatedLocations = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius
      );
      
      setLocationsData(calculatedLocations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast.error(t("Error fetching recommendations", "获取推荐出错"));
    } finally {
      setLoading(false);
    }
  }, [userLocation, searchRadius, t]);
  
  // Fetch more locations
  const fetchMoreLocations = useCallback(async () => {
    if (!userLocation || !canLoadMore) {
      return;
    }
    
    setSearching(true);
    setLoadMoreClickCount(prev => prev + 1);
    
    try {
      const expandedRadius = searchRadius * 2;
      const newLocations = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        expandedRadius
      );
      
      // Filter out duplicates
      const existingIds = new Set(locationsData.map(loc => 
        `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`
      ));
      
      const uniqueNewLocations = newLocations.filter(loc => {
        const id = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
        return !existingIds.has(id);
      });
      
      setLocationsData(prev => [...prev, ...uniqueNewLocations]);
      
    } catch (error) {
      console.error("Error fetching more locations:", error);
      toast.error(t("Error fetching more locations", "获取更多位置出错"));
    } finally {
      setSearching(false);
    }
  }, [userLocation, searchRadius, locationsData, canLoadMore, t]);
  
  return {
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
    locationsData,
    // Add this helper function directly in the return object
    findCalculatedLocations: useCallback((lat: number, lng: number, radius: number) => {
      return findCalculatedLocations(lat, lng, radius);
    }, [])
  };
};

export default useRecommendedLocationsFix;

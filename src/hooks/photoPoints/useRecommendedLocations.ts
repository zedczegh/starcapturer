
import { useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLocationFind } from './useLocationFind';
import { useCalculatedLocationsFind } from './useCalculatedLocationsFind';
import { useLanguage } from '@/contexts/LanguageContext';
import { currentSiqsStore } from '@/components/index/CalculatorSection';
import { useToast } from "@/components/ui/use-toast";
import { useRecommendedLocationServices } from './useRecommendedLocationServices';
import { useLocationLoadingState } from './useLocationLoadingState';

interface Location {
  latitude: number;
  longitude: number;
}

const MAX_LOAD_MORE_CLICKS = 2;

const DEFAULT_CALCULATED_RADIUS = 100;
const DEFAULT_CERTIFIED_RADIUS = 10000;

export const useRecommendedLocations = (
  userLocation: Location | null,
  initialRadius: number = DEFAULT_CALCULATED_RADIUS
) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const currentSiqs = currentSiqsStore.getValue();
  
  const { findLocationsWithinRadius, sortLocationsByQuality } = useLocationFind();
  const { findCalculatedLocations } = useCalculatedLocationsFind();
  
  const { 
    filterValidLocations, 
    separateLocationTypes, 
    showErrorToast 
  } = useRecommendedLocationServices();
  
  const {
    searchRadius, setSearchRadius,
    locations, setLocations,
    loading, setLoading,
    searching, setSearching,
    hasMore, setHasMore,
    page, setPage,
    canLoadMoreCalculated, setCanLoadMoreCalculated,
    loadMoreClickCount, setLoadMoreClickCount,
    prevRadiusRef, prevLocationRef, previousLocationsRef
  } = useLocationLoadingState(initialRadius);
  
  const loadLocations = useCallback(async () => {
    if (!userLocation) {
      return;
    }
    
    try {
      setLoading(true);
      
      const isRadiusIncrease = searchRadius > prevRadiusRef.current && 
                               prevLocationRef.current && 
                               userLocation.latitude === prevLocationRef.current.latitude &&
                               userLocation.longitude === prevLocationRef.current.longitude;
      
      const locationChanged = !prevLocationRef.current ||
        Math.abs(userLocation.latitude - prevLocationRef.current.latitude) > 0.001 ||
        Math.abs(userLocation.longitude - prevLocationRef.current.longitude) > 0.001;
      
      prevRadiusRef.current = searchRadius;
      prevLocationRef.current = userLocation;
      
      console.log(`Loading locations within ${searchRadius}km of ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}, preserving: ${isRadiusIncrease && !locationChanged}`);
      
      const certifiedResults = await findLocationsWithinRadius(
        userLocation.latitude,
        userLocation.longitude,
        DEFAULT_CERTIFIED_RADIUS
      );
      
      const calculatedResults = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius
      );
      
      const filteredCalculatedResults = calculatedResults.filter(loc => 
        !isWaterLocation(loc.latitude, loc.longitude)
      );
      
      const combinedResults = [...certifiedResults, ...filteredCalculatedResults];
      
      if (combinedResults.length === 0) {
        console.log("No locations found within the search radius");
        setLocations([]);
        previousLocationsRef.current = [];
        setHasMore(false);
        setCanLoadMoreCalculated(false);
      } else {
        const sortedResults = sortLocationsByQuality(combinedResults);
        setLocations(sortedResults);
        previousLocationsRef.current = sortedResults;
        setHasMore(sortedResults.length >= 20);
        setCanLoadMoreCalculated(true);
        setLoadMoreClickCount(0);
      }
      
      setPage(1);
    } catch (error) {
      console.error("Error loading recommended locations:", error);
      toast({
        variant: "destructive",
        title: t(
          "Failed to load recommended locations",
          "加载推荐位置失败"
        ),
        description: t(
          "Please try again.",
          "请重试。"
        )
      });
      setLocations([]);
      setHasMore(false);
      setCanLoadMoreCalculated(false);
    } finally {
      setLoading(false);
    }
  }, [
    searchRadius, userLocation, t, findLocationsWithinRadius, findCalculatedLocations, 
    sortLocationsByQuality, setLoading, setLocations, setHasMore, 
    setCanLoadMoreCalculated, setPage, setLoadMoreClickCount, toast
  ]);
  
  const loadMore = useCallback(async () => {
    if (!userLocation || !hasMore) {
      return;
    }
    
    try {
      setLoading(true);
      const nextPage = page + 1;
      
      const results = await findLocationsWithinRadius(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius
      );
      
      const filteredResults = results.filter(loc => 
        loc.isDarkSkyReserve || loc.certification || !isWaterLocation(loc.latitude, loc.longitude)
      );
      
      const existingIds = new Set(locations.map(loc => loc.id));
      const newResults = filteredResults.filter(loc => !existingIds.has(loc.id));
      
      if (newResults.length > 0) {
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
      toast({
        variant: "destructive",
        title: t(
          "Failed to load more locations",
          "加载更多位置失败"
        ),
        description: t(
          "Please try again.",
          "请重试。"
        )
      });
    } finally {
      setLoading(false);
    }
  }, [
    hasMore, locations, page, searchRadius, userLocation, 
    t, findLocationsWithinRadius, sortLocationsByQuality, 
    setLoading, setLocations, setHasMore, setPage, toast
  ]);
  
  const loadMoreCalculatedLocations = useCallback(async () => {
    if (!userLocation || loadMoreClickCount >= MAX_LOAD_MORE_CLICKS) {
      return;
    }
    
    try {
      setSearching(true);
      console.log(`Loading more calculated locations, click ${loadMoreClickCount + 1} of ${MAX_LOAD_MORE_CLICKS}`);
      
      const calculatedResults = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius
      );
      
      const filteredResults = calculatedResults.filter(loc => 
        !isWaterLocation(loc.latitude, loc.longitude)
      );
      
      const existingCoords = new Set(locations.map(loc => 
        `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`
      ));
      
      const newResults = filteredResults.filter(loc => {
        const coordKey = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
        return !existingCoords.has(coordKey);
      });
      
      if (newResults.length > 0) {
        const allLocations = [...locations, ...newResults];
        const sortedResults = sortLocationsByQuality(allLocations);
        
        setLocations(sortedResults);
        previousLocationsRef.current = sortedResults;
        
        const newClickCount = loadMoreClickCount + 1;
        setLoadMoreClickCount(newClickCount);
        
        if (newClickCount >= MAX_LOAD_MORE_CLICKS) {
          setCanLoadMoreCalculated(false);
        }
        
        toast({
          title: t(
            `Added ${newResults.length} more locations`,
            `添加了${newResults.length}个更多位置`
          )
        });
      } else {
        toast({
          title: t(
            "No more unique locations found",
            "未找到更多独特位置"
          )
        });
        
        setCanLoadMoreCalculated(false);
      }
    } catch (error) {
      console.error("Error loading more calculated locations:", error);
      toast({
        variant: "destructive",
        title: t(
          "Failed to load more locations",
          "加载更多位置失败"
        )
      });
    } finally {
      setSearching(false);
    }
  }, [
    loadMoreClickCount, locations, searchRadius, t, userLocation, 
    findCalculatedLocations, sortLocationsByQuality, setLocations, 
    setLoadMoreClickCount, setCanLoadMoreCalculated, setSearching, toast
  ]);
  
  const refreshSiqsData = useCallback(async () => {
    if (!userLocation) return;
    
    try {
      setLoading(true);
      await loadLocations();
    } catch (error) {
      console.error("Error refreshing SIQS data:", error);
      toast({
        variant: "destructive",
        title: t(
          "Failed to refresh location data",
          "刷新位置数据失败"
        )
      });
    } finally {
      setLoading(false);
    }
  }, [loadLocations, userLocation, t, setLoading, toast]);
  
  useEffect(() => {
    const radiusChanged = searchRadius !== prevRadiusRef.current;
    const locationChanged = 
      (userLocation && !prevLocationRef.current) ||
      (!userLocation && prevLocationRef.current) ||
      (userLocation && prevLocationRef.current && 
        (Math.abs(userLocation.latitude - prevLocationRef.current.latitude) > 0.001 || 
         Math.abs(userLocation.longitude - prevLocationRef.current.longitude) > 0.001));
    
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
    canLoadMoreCalculated,
    loadMoreCalculatedLocations,
    loadMoreClickCount,
    maxLoadMoreClicks: MAX_LOAD_MORE_CLICKS,
    currentSiqs
  };
};

// Helper function needed by the hook
const isWaterLocation = (lat: number, lng: number): boolean => {
  try {
    return import('@/utils/locationValidator').then(mod => mod.isWaterLocation(lat, lng, false));
  } catch (e) {
    console.error("Error checking water location:", e);
    return false;
  }
};

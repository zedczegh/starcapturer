import { useState, useEffect, useCallback, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLocationFind } from './useLocationFind';
import { useCalculatedLocationsFind } from './useCalculatedLocationsFind';
import { useLanguage } from '@/contexts/LanguageContext';
import { currentSiqsStore } from '@/components/index/CalculatorSection'; 
import { isWaterLocation } from '@/utils/locationValidator';
import { toast } from 'sonner';

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
  const [searchRadius, setSearchRadius] = useState<number>(initialRadius);
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const prevRadiusRef = useRef<number>(searchRadius);
  const prevLocationRef = useRef<Location | null>(userLocation);
  const previousLocationsRef = useRef<SharedAstroSpot[]>([]);
  
  const [canLoadMoreCalculated, setCanLoadMoreCalculated] = useState<boolean>(false);
  const [loadMoreClickCount, setLoadMoreClickCount] = useState<number>(0);
  
  const currentSiqs = currentSiqsStore.getValue();
  
  const { findLocationsWithinRadius, sortLocationsByQuality } = useLocationFind();
  const { findCalculatedLocations } = useCalculatedLocationsFind();
  
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
  }, [searchRadius, userLocation, t, findLocationsWithinRadius, findCalculatedLocations, sortLocationsByQuality]);
  
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
      toast.error(t(
        "Failed to load more locations. Please try again.",
        "加载更多位置失败。请重试。"
      ));
    } finally {
      setLoading(false);
    }
  }, [hasMore, locations, page, searchRadius, userLocation, t, findLocationsWithinRadius, sortLocationsByQuality]);
  
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
      } else {
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
  }, [loadMoreClickCount, locations, searchRadius, t, userLocation, findCalculatedLocations, sortLocationsByQuality]);
  
  const refreshSiqsData = useCallback(async () => {
    if (!userLocation) {
      return;
    }
    
    try {
      setLoading(true);
      
      await loadLocations();
    } catch (error) {
      console.error("Error refreshing SIQS data:", error);
      toast.error(t(
        "Failed to refresh location data",
        "刷新位置数据失败"
      ));
    } finally {
      setLoading(false);
    }
  }, [loadLocations, userLocation, t]);
  
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

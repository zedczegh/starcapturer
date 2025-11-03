
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLocationFind } from './useLocationFind';
import { useCalculatedLocationsFind } from './useCalculatedLocationsFind';
import { useLanguage } from '@/contexts/LanguageContext';
import { currentSiqsStore } from '@/components/index/CalculatorSection'; 
import { isWaterLocation } from '@/utils/validation';
import { toast } from '@/hooks/use-toast';
import { optimizedLocationDataService } from '@/services/optimized/LocationDataService';
import { debounce } from '@/utils/performanceOptimizer';

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
  const [allLoadedLocations, setAllLoadedLocations] = useState<SharedAstroSpot[]>([]); // Cache for filtering
  const [maxLoadedRadius, setMaxLoadedRadius] = useState<number>(initialRadius); // Track max loaded radius
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
  
  // Client-side filtering of pre-loaded locations for fast slider response
  const filterLocationsByRadius = useCallback((allLocs: SharedAstroSpot[], radius: number, center: Location) => {
    return allLocs.filter(loc => {
      const dx = loc.latitude - center.latitude;
      const dy = loc.longitude - center.longitude;
      const distance = Math.sqrt(dx * dx + dy * dy) * 111; // Approximate km
      return distance <= radius;
    });
  }, []);

  // Optimized load locations with smart caching for instant slider response
  const loadLocationsInternal = useCallback(async (forceReload: boolean = false) => {
    if (!userLocation) {
      return;
    }
    
    try {
      const locationChanged = !prevLocationRef.current ||
        Math.abs(userLocation.latitude - prevLocationRef.current.latitude) > 0.001 ||
        Math.abs(userLocation.longitude - prevLocationRef.current.longitude) > 0.001;
      
      // If radius is within already loaded range and location hasn't changed, just filter
      if (!forceReload && !locationChanged && searchRadius <= maxLoadedRadius && allLoadedLocations.length > 0) {
        console.log(`Fast filtering: Using cached ${allLoadedLocations.length} locations for radius ${searchRadius}km`);
        const filtered = filterLocationsByRadius(allLoadedLocations, searchRadius, userLocation);
        const sortedResults = sortLocationsByQuality(filtered);
        setLocations(sortedResults);
        previousLocationsRef.current = sortedResults;
        return; // Fast path - no API call needed!
      }
      
      setLoading(true);
      
      prevRadiusRef.current = searchRadius;
      prevLocationRef.current = userLocation;
      
      // Load with a buffer for slider responsiveness (load 1.5x the requested radius)
      const loadRadius = Math.max(searchRadius * 1.5, searchRadius + 50);
      console.log(`Loading locations within ${loadRadius}km (display: ${searchRadius}km) of ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`);
      
      // Start prefetching in background
      optimizedLocationDataService.prefetchNearbyData(
        userLocation.latitude,
        userLocation.longitude,
        loadRadius
      );
      
      // Load certified and calculated locations in parallel using optimized service
      const [certifiedResults, calculatedResults] = await Promise.all([
        optimizedLocationDataService.getCertifiedLocations(
          userLocation.latitude,
          userLocation.longitude,
          DEFAULT_CERTIFIED_RADIUS
        ),
        optimizedLocationDataService.getCalculatedLocations(
          userLocation.latitude,
          userLocation.longitude,
          loadRadius, // Load more than requested
          20
        )
      ]);
      
      const combinedResults = [...certifiedResults, ...calculatedResults];
      
      if (combinedResults.length === 0) {
        console.log("No locations found within the search radius");
        setLocations([]);
        setAllLoadedLocations([]);
        setMaxLoadedRadius(loadRadius);
        previousLocationsRef.current = [];
        setHasMore(false);
        setCanLoadMoreCalculated(false);
      } else {
        // Store all loaded locations for fast filtering
        setAllLoadedLocations(combinedResults);
        setMaxLoadedRadius(loadRadius);
        
        // Filter to display radius
        const filtered = filterLocationsByRadius(combinedResults, searchRadius, userLocation);
        const sortedResults = sortLocationsByQuality(filtered);
        setLocations(sortedResults);
        previousLocationsRef.current = sortedResults;
        setHasMore(sortedResults.length >= 20);
        setCanLoadMoreCalculated(true);
        setLoadMoreClickCount(0);
      }
      
      setPage(1);
    } catch (error) {
      console.error("Error loading recommended locations:", error);
      toast.error(
        t(
          "Failed to load recommended locations",
          "加载推荐位置失败"
        ),
        t(
          "Please try again.",
          "请重试。"
        )
      );
      setLocations([]);
      setAllLoadedLocations([]);
      setHasMore(false);
      setCanLoadMoreCalculated(false);
    } finally {
      setLoading(false);
    }
  }, [searchRadius, userLocation, t, sortLocationsByQuality, maxLoadedRadius, allLoadedLocations, filterLocationsByRadius]);

  // Debounced version with shorter delay for better responsiveness
  const loadLocations = useMemo(
    () => debounce(loadLocationsInternal, 150),
    [loadLocationsInternal]
  );
  
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
      toast.error(
        t(
          "Failed to load more locations",
          "加载更多位置失败"
        ),
        t(
          "Please try again.",
          "请重试。"
        )
      );
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
        
        toast.success(
          t(
            `Added ${newResults.length} more locations`,
            `添加了${newResults.length}个更多位置`
          )
        );
      } else {
        toast.info(
          t(
            "No more unique locations found",
            "未找到更多独特位置"
          )
        );
        
        setCanLoadMoreCalculated(false);
      }
    } catch (error) {
      console.error("Error loading more calculated locations:", error);
      toast.error(
        t(
          "Failed to load more locations",
          "加载更多位置失败"
        )
      );
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
      toast.error(
        t(
          "Failed to refresh location data",
          "刷新位置数据失败"
        )
      );
    } finally {
      setLoading(false);
    }
  }, [loadLocations, userLocation, t]);
  
  // Optimized effect: instant filtering for radius changes within loaded range
  useEffect(() => {
    if (!userLocation) return;
    
    const radiusChanged = searchRadius !== prevRadiusRef.current;
    const locationChanged = 
      (userLocation && !prevLocationRef.current) ||
      (!userLocation && prevLocationRef.current) ||
      (userLocation && prevLocationRef.current && 
        (Math.abs(userLocation.latitude - prevLocationRef.current.latitude) > 0.001 || 
         Math.abs(userLocation.longitude - prevLocationRef.current.longitude) > 0.001));
    
    if (locationChanged) {
      // Location changed - force full reload
      loadLocations();
    } else if (radiusChanged) {
      // Radius changed - try instant filtering first
      if (searchRadius <= maxLoadedRadius && allLoadedLocations.length > 0) {
        // Instant client-side filtering
        const filtered = filterLocationsByRadius(allLoadedLocations, searchRadius, userLocation);
        const sortedResults = sortLocationsByQuality(filtered);
        setLocations(sortedResults);
        previousLocationsRef.current = sortedResults;
        prevRadiusRef.current = searchRadius;
      } else {
        // Need to load more data
        loadLocations();
      }
    }
  }, [loadLocations, searchRadius, userLocation, maxLoadedRadius, allLoadedLocations, filterLocationsByRadius, sortLocationsByQuality]);
  
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

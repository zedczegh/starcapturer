import { useState, useEffect, useCallback, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLocationFind } from './useLocationFind';
import { useCalculatedLocationsFind } from './useCalculatedLocationsFind';
import { useLocationLoadingState } from './useLocationLoadingState';
import { useCalculatedLocationsState } from './useCalculatedLocationsState';
import { DEFAULT_SEARCH_RADIUS, DEFAULT_SPOT_LIMIT, DEFAULT_CERTIFIED_RADIUS } from '@/utils/constants';
import { currentSiqsStore } from '@/components/index/CalculatorSection';
import { isWaterLocation } from '@/utils/locationValidator';
import { toast } from '@/components/ui/use-toast';

interface Location {
  latitude: number;
  longitude: number;
}

export const useRecommendedLocations = (
  userLocation: Location | null,
  initialRadius: number = DEFAULT_SEARCH_RADIUS
) => {
  const [searchRadius, setSearchRadius] = useState<number>(initialRadius);
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const prevRadiusRef = useRef<number>(searchRadius);
  const prevLocationRef = useRef<Location | null>(userLocation);
  const previousLocationsRef = useRef<SharedAstroSpot[]>([]);
  
  const currentSiqs = currentSiqsStore.getValue();
  
  const { findLocationsWithinRadius, sortLocationsByQuality } = useLocationFind();
  const { findCalculatedLocations } = useCalculatedLocationsFind();
  
  const {
    loading,
    searching,
    hasMore,
    page,
    startLoading,
    stopLoading,
    startSearching,
    stopSearching,
    incrementPage,
    resetPage,
    handleError
  } = useLocationLoadingState();

  const {
    canLoadMoreCalculated,
    loadMoreClickCount,
    maxLoadMoreClicks,
    incrementLoadMoreClicks,
    resetLoadMoreState,
    setCanLoadMoreCalculated
  } = useCalculatedLocationsState();

  const loadLocations = useCallback(async () => {
    if (!userLocation) {
      return;
    }
    
    try {
      startLoading();
      
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
        stopLoading(false);
        setCanLoadMoreCalculated(false);
      } else {
        const sortedResults = sortLocationsByQuality(combinedResults);
        setLocations(sortedResults);
        previousLocationsRef.current = sortedResults;
        stopLoading(sortedResults.length >= 20);
        setCanLoadMoreCalculated(true);
        resetLoadMoreState();
      }
      
      resetPage();
    } catch (error) {
      console.error("Error loading recommended locations:", error);
      handleError("Failed to load recommended locations");
      setLocations([]);
      stopLoading(false);
      setCanLoadMoreCalculated(false);
    } finally {
      stopLoading();
    }
  }, [searchRadius, userLocation, findLocationsWithinRadius, findCalculatedLocations, sortLocationsByQuality, startLoading, stopLoading, handleError, resetPage, resetLoadMoreState]);
  
  const loadMore = useCallback(async () => {
    if (!userLocation || !hasMore) {
      return;
    }
    
    try {
      startLoading();
      incrementPage();
      
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
        stopLoading(newResults.length >= 10);
      } else {
        stopLoading(false);
      }
    } catch (error) {
      console.error("Error loading more locations:", error);
      handleError("Failed to load more locations");
    } finally {
      stopLoading();
    }
  }, [hasMore, locations, searchRadius, userLocation, findLocationsWithinRadius, sortLocationsByQuality, startLoading, stopLoading, incrementPage, handleError]);
  
  const loadMoreCalculatedLocations = useCallback(async () => {
    if (!userLocation || loadMoreClickCount >= maxLoadMoreClicks) {
      return;
    }
    
    try {
      startSearching();
      console.log(`Loading more calculated locations, click ${loadMoreClickCount + 1} of ${maxLoadMoreClicks}`);
      
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
        
        incrementLoadMoreClicks();
        
        toast({
          title: `Added ${newResults.length} more locations`
        });
      } else {
        toast({
          title: "No more unique locations found"
        });
        
        setCanLoadMoreCalculated(false);
      }
    } catch (error) {
      console.error("Error loading more calculated locations:", error);
      handleError("Failed to load more locations");
    } finally {
      stopSearching();
    }
  }, [loadMoreClickCount, locations, searchRadius, userLocation, findCalculatedLocations, sortLocationsByQuality, incrementLoadMoreClicks, maxLoadMoreClicks, startSearching, stopSearching, handleError]);
  
  const refreshSiqsData = useCallback(async () => {
    if (!userLocation) {
      return;
    }
    
    try {
      startLoading();
      
      await loadLocations();
    } catch (error) {
      console.error("Error refreshing SIQS data:", error);
      handleError("Failed to refresh location data");
    } finally {
      stopLoading();
    }
  }, [loadLocations, userLocation, startLoading, stopLoading, handleError]);

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
    maxLoadMoreClicks,
    currentSiqs
  };
};


import { useState, useEffect, useCallback, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLocationFind } from './useLocationFind';
import { useLanguage } from '@/contexts/LanguageContext';
import { currentSiqsStore } from '@/components/index/CalculatorSection'; 
import { useLocationLoadingState } from './recommendedLocations/useLocationLoadingState';
import { useCalculatedLocations } from './recommendedLocations/useCalculatedLocations';

interface Location {
  latitude: number;
  longitude: number;
}

const DEFAULT_CALCULATED_RADIUS = 100;
const DEFAULT_CERTIFIED_RADIUS = 10000;

export const useRecommendedLocations = (
  userLocation: Location | null,
  initialRadius: number = DEFAULT_CALCULATED_RADIUS
) => {
  const [searchRadius, setSearchRadius] = useState<number>(initialRadius);
  const prevRadiusRef = useRef<number>(searchRadius);
  const prevLocationRef = useRef<Location | null>(userLocation);
  const previousLocationsRef = useRef<SharedAstroSpot[]>([]);
  
  const currentSiqs = currentSiqsStore.getValue();
  
  const { findLocationsWithinRadius, sortLocationsByQuality } = useLocationFind();
  
  const {
    locations,
    setLocations,
    loading,
    searching,
    hasMore,
    setHasMore,
    page,
    handleLocationSuccess,
    handleLocationError,
    startLoading,
    stopLoading,
    startSearching,
    stopSearching,
    incrementPage
  } = useLocationLoadingState();
  
  const {
    loadCalculatedLocations,
    loadMoreCalculatedLocations,
    canLoadMoreCalculated,
    loadMoreClickCount,
    maxLoadMoreClicks,
    resetCalculatedState
  } = useCalculatedLocations(
    userLocation, 
    searchRadius,
    handleLocationSuccess,
    sortLocationsByQuality
  );
  
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
      
      const calculatedResults = await loadCalculatedLocations();
      
      const combinedResults = [...certifiedResults, ...calculatedResults];
      
      if (combinedResults.length === 0) {
        console.log("No locations found within the search radius");
        setLocations([]);
        previousLocationsRef.current = [];
        setHasMore(false);
        resetCalculatedState();
      } else {
        const sortedResults = sortLocationsByQuality(combinedResults);
        setLocations(sortedResults);
        previousLocationsRef.current = sortedResults;
        setHasMore(sortedResults.length >= 20);
        resetCalculatedState();
      }
    } catch (error) {
      handleLocationError(error);
    } finally {
      stopLoading();
    }
  }, [
    searchRadius, 
    userLocation,
    findLocationsWithinRadius,
    loadCalculatedLocations,
    sortLocationsByQuality,
    setLocations,
    setHasMore,
    startLoading,
    stopLoading,
    handleLocationError,
    resetCalculatedState
  ]);
  
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
      
      const existingIds = new Set(locations.map(loc => loc.id));
      const newResults = results.filter(loc => !existingIds.has(loc.id));
      
      if (newResults.length > 0) {
        const allLocations = [...locations, ...newResults];
        const sortedResults = sortLocationsByQuality(allLocations);
        
        setLocations(sortedResults);
        previousLocationsRef.current = sortedResults;
        setHasMore(newResults.length >= 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      handleLocationError(error);
    } finally {
      stopLoading();
    }
  }, [
    hasMore, 
    locations, 
    searchRadius, 
    userLocation,
    findLocationsWithinRadius,
    sortLocationsByQuality,
    incrementPage,
    setLocations,
    setHasMore,
    startLoading,
    stopLoading,
    handleLocationError
  ]);
  
  const loadMoreCalculatedLocs = useCallback(async () => {
    try {
      startSearching();
      const updatedLocations = await loadMoreCalculatedLocations(locations);
      setLocations(updatedLocations);
    } finally {
      stopSearching();
    }
  }, [
    locations, 
    setLocations, 
    loadMoreCalculatedLocations,
    startSearching,
    stopSearching
  ]);
  
  const refreshSiqsData = useCallback(async () => {
    await loadLocations();
  }, [loadLocations]);
  
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
    loadMoreCalculatedLocations: loadMoreCalculatedLocs,
    loadMoreClickCount,
    maxLoadMoreClicks,
    currentSiqs
  };
};

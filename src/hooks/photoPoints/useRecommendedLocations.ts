
import { useState, useEffect, useCallback, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { findCertifiedLocations } from '@/services/location/certifiedLocationsService';
import { useCalculatedLocationsFind } from './useCalculatedLocationsFind';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { updateLocationsWithRealTimeSiqs } from '@/services/realTimeSiqsService/locationUpdateService';
import { generateForecastQualitySpots } from '@/services/forecastSpotService';

export const useRecommendedLocations = (
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number = 100,
  forecastDay: number = 0
) => {
  const { t } = useLanguage();
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [searchRadius_, setSearchRadius] = useState<number>(searchRadius);
  const [loading, setLoading] = useState<boolean>(true);
  const [searching, setSearching] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const loadMoreClickCount = useRef<number>(0);
  const maxLoadMoreClicks = 2;
  
  // Get the findCalculatedLocations function from the hook
  const { findCalculatedLocations } = useCalculatedLocationsFind();
  
  // Track if component is mounted
  const isMounted = useRef<boolean>(true);
  
  // Use refs to avoid closure issues
  const lastSearchParams = useRef<{
    lat: number | null;
    lng: number | null;
    radius: number;
    forecastDay: number;
  }>({
    lat: null,
    lng: null,
    radius: 0,
    forecastDay: 0
  });
  
  // Load locations when parameters change
  useEffect(() => {
    if (!userLocation) return;
    
    // Check if search params have changed enough to warrant a new search
    const newParams = {
      lat: userLocation.latitude,
      lng: userLocation.longitude,
      radius: searchRadius,
      forecastDay: forecastDay
    };
    
    const paramsChanged = 
      lastSearchParams.current.lat !== newParams.lat ||
      lastSearchParams.current.lng !== newParams.lng ||
      lastSearchParams.current.radius !== newParams.radius ||
      lastSearchParams.current.forecastDay !== newParams.forecastDay;
    
    if (!paramsChanged) return;
    
    // Update last search params
    lastSearchParams.current = newParams;
    
    // Reset load more click count when parameters change
    loadMoreClickCount.current = 0;
    
    // Set loading state
    setLoading(true);
    setSearching(true);
    
    // Fetch locations based on parameters
    const fetchLocations = async () => {
      try {
        let fetchedLocations: SharedAstroSpot[] = [];
        
        if (forecastDay > 0) {
          // For future days, use forecast-based spot generation
          fetchedLocations = await generateForecastQualitySpots(
            userLocation.latitude,
            userLocation.longitude,
            searchRadius,
            forecastDay,
            10,
            5
          );
        } else {
          // For today (forecastDay = 0), use regular calculated spots
          fetchedLocations = await findCalculatedLocations(
            userLocation.latitude,
            userLocation.longitude,
            searchRadius,
            true,
            10,
            false,
            []
          );
        }
        
        if (isMounted.current) {
          setLocations(fetchedLocations);
          setHasMore(fetchedLocations.length >= 10);
          setLoading(false);
          setSearching(false);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
        if (isMounted.current) {
          setLoading(false);
          setSearching(false);
          toast.error(t("Failed to load locations", "加载位置失败"));
        }
      }
    };
    
    fetchLocations();
  }, [userLocation, searchRadius, forecastDay, t, findCalculatedLocations]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Load more locations
  const loadMore = useCallback(async () => {
    if (!userLocation || loading || !hasMore) return;
    
    setSearching(true);
    
    try {
      if (forecastDay > 0) {
        // For future days, use forecast-based spot generation with larger limit
        const additionalSpots = await generateForecastQualitySpots(
          userLocation.latitude,
          userLocation.longitude,
          searchRadius,
          forecastDay,
          10,
          5
        );
        
        if (isMounted.current) {
          // Filter out duplicates
          const existingCoords = new Set(locations.map(l => `${l.latitude.toFixed(6)},${l.longitude.toFixed(6)}`));
          const newSpots = additionalSpots.filter(spot => {
            const coordKey = `${spot.latitude.toFixed(6)},${spot.longitude.toFixed(6)}`;
            return !existingCoords.has(coordKey);
          });
          
          setLocations(prevLocations => [...prevLocations, ...newSpots]);
          setHasMore(newSpots.length >= 5);
        }
      } else {
        // For today, use regular calculated spots
        const moreLocations = await findCalculatedLocations(
          userLocation.latitude,
          userLocation.longitude,
          searchRadius * 1.5, // Increase search radius
          true,
          10,
          true,
          locations
        );
        
        if (isMounted.current) {
          setLocations(moreLocations);
          setHasMore(moreLocations.length > locations.length);
        }
      }
    } catch (error) {
      console.error("Error loading more locations:", error);
      toast.error(t("Failed to load more locations", "加载更多位置失败"));
    } finally {
      if (isMounted.current) {
        setSearching(false);
      }
    }
  }, [userLocation, searchRadius, forecastDay, loading, hasMore, locations, t, findCalculatedLocations]);
  
  // Refresh SIQS data for existing locations
  const refreshSiqsData = useCallback(async () => {
    if (!locations.length) return;
    
    setSearching(true);
    toast.info(t("Refreshing SIQS data...", "正在刷新SIQS数据..."));
    
    try {
      const updatedLocations = await updateLocationsWithRealTimeSiqs(locations);
      if (isMounted.current) {
        setLocations(updatedLocations);
      }
    } catch (error) {
      console.error("Error refreshing SIQS data:", error);
    } finally {
      if (isMounted.current) {
        setSearching(false);
      }
    }
  }, [locations, t]);
  
  // Function to load more calculated locations
  const loadMoreCalculatedLocations = useCallback(async () => {
    if (!userLocation || loadMoreClickCount.current >= maxLoadMoreClicks) return;
    
    loadMoreClickCount.current++;
    setSearching(true);
    
    try {
      let additionalLocations: SharedAstroSpot[] = [];
      
      if (forecastDay > 0) {
        // For future days, use forecast-based spot generation with larger radius
        additionalLocations = await generateForecastQualitySpots(
          userLocation.latitude,
          userLocation.longitude,
          searchRadius * 1.5,
          forecastDay,
          15,
          4.5
        );
      } else {
        // For today, use regular calculated spots
        additionalLocations = await findCalculatedLocations(
          userLocation.latitude,
          userLocation.longitude,
          searchRadius * 1.5,
          true,
          15,
          true,
          locations
        );
      }
      
      if (isMounted.current) {
        // Remove duplicates
        const existingCoords = new Set(locations.map(loc => 
          `${loc.latitude.toFixed(6)},${loc.longitude.toFixed(6)}`
        ));
        
        const uniqueNew = additionalLocations.filter(loc => {
          const coordKey = `${loc.latitude.toFixed(6)},${loc.longitude.toFixed(6)}`;
          return !existingCoords.has(coordKey);
        });
        
        setLocations(prev => [...prev, ...uniqueNew]);
        setHasMore(uniqueNew.length > 0);
      }
    } catch (error) {
      console.error("Error loading more calculated locations:", error);
      toast.error(t("Failed to load additional locations", "加载更多位置失败"));
    } finally {
      if (isMounted.current) {
        setSearching(false);
      }
    }
  }, [userLocation, searchRadius, forecastDay, locations, t, findCalculatedLocations]);
  
  // Determine if more calculated locations can be loaded
  const canLoadMoreCalculated = useCallback(() => {
    return loadMoreClickCount.current < maxLoadMoreClicks && userLocation !== null;
  }, [userLocation]);
  
  return {
    locations,
    searchRadius: searchRadius_,
    setSearchRadius,
    loading,
    searching,
    hasMore,
    loadMore,
    refreshSiqsData,
    canLoadMoreCalculated: canLoadMoreCalculated(),
    loadMoreCalculatedLocations,
    loadMoreClickCount: loadMoreClickCount.current,
    maxLoadMoreClicks
  };
};

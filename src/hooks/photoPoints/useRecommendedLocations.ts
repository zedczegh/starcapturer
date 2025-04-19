
import { useState, useEffect, useCallback, useRef } from "react";
import { useCalculatedLocationsFind } from "./useCalculatedLocationsFind";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface UseRecommendedLocationsProps {
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  maxInitialLoad?: number;
}

export const useRecommendedLocations = (
  userLocation: { latitude: number; longitude: number } | null,
  defaultSearchRadius: number = 500
) => {
  const { t } = useLanguage();
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [searchRadius, setSearchRadius] = useState(defaultSearchRadius);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadMoreClickCount, setLoadMoreClickCount] = useState(0);
  const maxLoadMoreClicks = 3;
  const locationsRef = useRef<SharedAstroSpot[]>([]);
  const previousLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  
  // Use our hook with its improved location handling
  const { findCalculatedLocations, isLoading: calculatedLocationsLoading } = useCalculatedLocationsFind();

  // Update loading state when calculated locations are loading
  useEffect(() => {
    setLoading(calculatedLocationsLoading);
  }, [calculatedLocationsLoading]);

  // Load more locations based on current search parameters
  const loadMoreCalculatedLocations = useCallback(async () => {
    if (!userLocation) return;
    if (loadMoreClickCount >= maxLoadMoreClicks) return;
    
    setSearching(true);
    setLoadMoreClickCount(prev => prev + 1);
    
    try {
      // Load more calculated locations with expanded radius
      const expandedRadius = searchRadius * (1 + (loadMoreClickCount + 1) * 0.5);
      console.log(`Loading more calculated locations with expanded radius: ${expandedRadius}km`);
      
      const newLocations = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        expandedRadius,
        true,
        50,
        true,
        locationsRef.current
      );
      
      setLocations(newLocations);
      locationsRef.current = newLocations;
      
      // Determine if there are potentially more locations to load
      setHasMore(newLocations.length < 100 && loadMoreClickCount < maxLoadMoreClicks - 1);
    } catch (error) {
      console.error("Error loading more locations:", error);
    } finally {
      setSearching(false);
    }
  }, [userLocation, searchRadius, loadMoreClickCount, findCalculatedLocations, maxLoadMoreClicks]);
  
  // Load more standard locations (pagination)
  const loadMore = useCallback(() => {
    // Standard pagination logic
    console.log("Loading more locations (standard pagination)");
  }, []);

  // Load locations when user location changes or search radius is updated
  useEffect(() => {
    const loadLocations = async () => {
      if (!userLocation) return;
      
      // Check if location has actually changed
      const isSameLocation = previousLocationRef.current && 
        Math.abs(previousLocationRef.current.latitude - userLocation.latitude) < 0.001 &&
        Math.abs(previousLocationRef.current.longitude - userLocation.longitude) < 0.001;
      
      if (isSameLocation && locationsRef.current.length > 0) {
        console.log("Location hasn't changed significantly, using cached results");
        return;
      }
      
      setLoading(true);
      console.log(`Loading initial locations for ${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)} with radius ${searchRadius}km`);
      
      try {
        // Reset load more click count
        setLoadMoreClickCount(0);
        
        // Find locations within radius
        const newLocations = await findCalculatedLocations(
          userLocation.latitude,
          userLocation.longitude,
          searchRadius,
          true,
          20
        );
        
        // Update our state and refs
        setLocations(newLocations);
        locationsRef.current = newLocations;
        previousLocationRef.current = { ...userLocation };
        
        // Determine if there could be more locations
        setHasMore(newLocations.length < 100);
        
        console.log(`Found ${newLocations.length} locations within ${searchRadius}km`);
      } catch (error) {
        console.error("Error loading locations:", error);
        toast.error(t("Error loading locations", "加载位置时出错"));
      } finally {
        setLoading(false);
      }
    };
    
    loadLocations();
  }, [userLocation, searchRadius, findCalculatedLocations, t]);

  // Force refresh SIQS data
  const refreshSiqsData = useCallback(async () => {
    if (!userLocation) return;
    
    setLoading(true);
    console.log(`Refreshing SIQS data for ${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`);
    
    try {
      // Reset load more click count
      setLoadMoreClickCount(0);
      
      // Reload with same parameters
      const freshLocations = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius,
        true,
        20
      );
      
      setLocations(freshLocations);
      locationsRef.current = freshLocations;
      
      setHasMore(freshLocations.length < 100);
    } catch (error) {
      console.error("Error refreshing SIQS data:", error);
    } finally {
      setLoading(false);
    }
  }, [userLocation, searchRadius, findCalculatedLocations]);

  // Check if we can load more calculated locations
  const canLoadMoreCalculated = loadMoreClickCount < maxLoadMoreClicks;

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
    maxLoadMoreClicks
  };
};

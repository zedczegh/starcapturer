
import { useState, useCallback, useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { findCalculatedLocations } from './useCalculatedLocationsFind';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { calculateDistance } from '@/utils/geoUtils';
import { isWaterLocation } from '@/utils/validation';

export function useRecommendedLocations(
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number,
) {
  const { t } = useLanguage();
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchRadiusState, setSearchRadiusState] = useState(searchRadius);
  const [hasMore, setHasMore] = useState(true);
  const [loadMoreClickCount, setLoadMoreClickCount] = useState(0);
  const maxLoadMoreClicks = 2;
  const [canLoadMoreCalculated, setCanLoadMoreCalculated] = useState(true);
  const [initialSearch, setInitialSearch] = useState(true);

  const processNewLocations = useCallback((newLocations: SharedAstroSpot[]) => {
    if (!newLocations || newLocations.length === 0) {
      console.log("No new locations to process");
      if (initialSearch) {
        setHasMore(true); // Keep hasMore true on initial search even if no locations found
        setCanLoadMoreCalculated(true);
      } else {
        setHasMore(false);
        setCanLoadMoreCalculated(false);
      }
      return;
    }

    setLocations((prevLocations) => {
      // Create a uniqueness check using coordinate precision
      const uniqueCheck = new Map();
      
      // Add existing locations to uniqueness check
      prevLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(4)}-${loc.longitude.toFixed(4)}`;
          uniqueCheck.set(key, loc);
        }
      });
      
      // Add new locations if they don't already exist
      newLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(4)}-${loc.longitude.toFixed(4)}`;
          if (!uniqueCheck.has(key)) {
            uniqueCheck.set(key, loc);
          }
        }
      });
      
      // Convert map back to array
      return Array.from(uniqueCheck.values());
    });

    // If we got fewer locations than requested, there may not be more to load
    if (newLocations.length < 5) {
      setHasMore(initialSearch); // Keep hasMore true on initial search
      setCanLoadMoreCalculated(initialSearch);
    } else {
      setHasMore(true);
      setCanLoadMoreCalculated(true);
    }
    
    setInitialSearch(false);
  }, [initialSearch]);

  const loadMoreCalculatedLocations = useCallback(async () => {
    if (!userLocation || !canLoadMoreCalculated) return;
    
    setLoadingMore(true);
    try {
      console.log("Finding more calculated locations...");
      // Use a larger batch size when explicitly loading more
      const batchSize = 10;
      
      const newLocations = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius,
        batchSize
      );
      
      processNewLocations(newLocations);
      setLoadMoreClickCount((prevCount) => prevCount + 1);
    } catch (error) {
      console.error("Error loading more calculated locations:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [userLocation, searchRadius, canLoadMoreCalculated, processNewLocations]);

  const refreshSiqsData = useCallback(() => {
    if (!userLocation) {
      toast.error(t("No location selected", "未选择位置"));
      return;
    }

    setSearching(true);
    setLoading(true);
    setHasMore(true);
    setCanLoadMoreCalculated(true);
    setLoadMoreClickCount(0);
    setLocations([]);
    setInitialSearch(true);

    findCalculatedLocations(userLocation.latitude, userLocation.longitude, searchRadius)
      .then((newLocations) => {
        setLocations(newLocations);
        if (newLocations.length < 5 && !initialSearch) {
          setHasMore(false);
          setCanLoadMoreCalculated(false);
        }
      })
      .catch((error) => {
        console.error("Error fetching locations:", error);
        toast.error(t("Failed to load locations", "无法加载位置"));
        setLocations([]);
        setHasMore(false);
        setCanLoadMoreCalculated(false);
      })
      .finally(() => {
        setLoading(false);
        setSearching(false);
        setInitialSearch(false);
      });
  }, [userLocation, searchRadius, t, initialSearch]);

  const loadMore = useCallback(() => {
    if (!userLocation || loadingMore || !hasMore) return;

    setLoadingMore(true);
    findCalculatedLocations(userLocation.latitude, userLocation.longitude, searchRadius, 10)
      .then((newLocations) => {
        if (newLocations.length === 0) {
          setHasMore(false);
          return;
        }

        processNewLocations(newLocations);
      })
      .catch((error) => {
        console.error("Error loading more locations:", error);
        toast.error(t("Failed to load more locations", "无法加载更多位置"));
        setHasMore(false);
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [userLocation, loadingMore, hasMore, searchRadius, t, processNewLocations]);

  // Initial load when userLocation changes
  useEffect(() => {
    if (userLocation) {
      setLoading(true);
      setSearching(true);
      setHasMore(true);
      setCanLoadMoreCalculated(true);
      setLoadMoreClickCount(0);
      setInitialSearch(true);
      
      console.log(`Finding locations near ${userLocation.latitude}, ${userLocation.longitude} with radius ${searchRadius}km`);
      
      findCalculatedLocations(userLocation.latitude, userLocation.longitude, searchRadius)
        .then((newLocations) => {
          console.log(`Found ${newLocations.length} locations`);
          setLocations(newLocations);
          
          // If we got fewer locations than expected on initial load, try loading more
          if (newLocations.length < 5) {
            console.log("Initial load returned few locations, trying to find more...");
            return findCalculatedLocations(
              userLocation.latitude, 
              userLocation.longitude,
              searchRadius * 1.5, // Try a slightly larger radius
              15 // Try to get more locations
            );
          }
          return null;
        })
        .then((moreLocations) => {
          if (moreLocations && moreLocations.length > 0) {
            console.log(`Found ${moreLocations.length} additional locations`);
            processNewLocations(moreLocations);
          }
        })
        .catch((error) => {
          console.error("Error fetching locations:", error);
          toast.error(t("Failed to load locations", "无法加载位置"));
          setLocations([]);
          setHasMore(false);
          setCanLoadMoreCalculated(false);
        })
        .finally(() => {
          setLoading(false);
          setSearching(false);
          setInitialSearch(false);
        });
    }
  }, [userLocation, searchRadius, t, processNewLocations]);

  return {
    locations,
    loading,
    loadingMore,
    searching,
    refreshSiqsData,
    hasMore,
    loadMore,
    searchRadius: searchRadiusState,
    setSearchRadius: setSearchRadiusState,
    canLoadMoreCalculated,
    loadMoreCalculatedLocations,
    loadMoreClickCount,
    maxLoadMoreClicks
  };
}

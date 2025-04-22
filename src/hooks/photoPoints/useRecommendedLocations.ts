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

  const processNewLocations = useCallback((newLocations: SharedAstroSpot[]) => {
    if (!newLocations || newLocations.length === 0) {
      setHasMore(false);
      setCanLoadMoreCalculated(false);
      return;
    }

    setLocations((prevLocations) => {
      const existingIds = new Set(prevLocations.map((loc) => loc.id));
      const uniqueNewLocations = newLocations.filter((loc) => !existingIds.has(loc.id));
      return [...prevLocations, ...uniqueNewLocations];
    });

    if (newLocations.length < 10) {
      setHasMore(false);
      setCanLoadMoreCalculated(false);
    } else {
      setHasMore(true);
      setCanLoadMoreCalculated(true);
    }
  }, []);

  const loadMoreCalculatedLocations = useCallback(async () => {
    if (!userLocation || !canLoadMoreCalculated) return;
    
    setLoadingMore(true);
    try {
      const newLocations = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius
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

    findCalculatedLocations(userLocation.latitude, userLocation.longitude, searchRadius)
      .then((newLocations) => {
        setLocations(newLocations);
        if (newLocations.length < 10) {
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
      });
  }, [userLocation, searchRadius, t]);

  const loadMore = useCallback(() => {
    if (!userLocation || loadingMore || !hasMore) return;

    setLoadingMore(true);
    findCalculatedLocations(userLocation.latitude, userLocation.longitude, searchRadius)
      .then((newLocations) => {
        if (newLocations.length === 0) {
          setHasMore(false);
          return;
        }

        setLocations((prevLocations) => {
          const existingIds = new Set(prevLocations.map((loc) => loc.id));
          const uniqueNewLocations = newLocations.filter((loc) => !existingIds.has(loc.id));
          return [...prevLocations, ...uniqueNewLocations];
        });

        if (newLocations.length < 10) {
          setHasMore(false);
        }
      })
      .catch((error) => {
        console.error("Error loading more locations:", error);
        toast.error(t("Failed to load more locations", "无法加载更多位置"));
        setHasMore(false);
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [userLocation, loadingMore, hasMore, searchRadius, t]);

  useEffect(() => {
    if (userLocation) {
      setLoading(true);
      setSearching(true);
      setHasMore(true);
      setCanLoadMoreCalculated(true);
      setLoadMoreClickCount(0);
      setLocations([]);

      findCalculatedLocations(userLocation.latitude, userLocation.longitude, searchRadius)
        .then((newLocations) => {
          setLocations(newLocations);
          if (newLocations.length < 10) {
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
        });
    }
  }, [userLocation, searchRadius, t]);

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

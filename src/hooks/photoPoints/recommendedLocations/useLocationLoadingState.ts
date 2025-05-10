
import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

/**
 * Hook to manage loading states for location data
 */
export function useLocationLoadingState() {
  const { t } = useLanguage();
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  
  const handleLocationSuccess = useCallback((newLocations: SharedAstroSpot[]) => {
    setLocations(newLocations);
    setHasMore(newLocations.length >= 20);
    setPage(1);
  }, []);
  
  const handleLocationError = useCallback((error: any) => {
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
  }, [t]);
  
  const startLoading = useCallback(() => {
    setLoading(true);
  }, []);
  
  const stopLoading = useCallback(() => {
    setLoading(false);
  }, []);
  
  const startSearching = useCallback(() => {
    setSearching(true);
  }, []);
  
  const stopSearching = useCallback(() => {
    setSearching(false);
  }, []);
  
  const incrementPage = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);
  
  return {
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
  };
}

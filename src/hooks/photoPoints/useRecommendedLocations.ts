import { useState, useEffect } from 'react';
import { useCache } from '@/hooks/useCache';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { fetchDarkSkyLocations } from '@/lib/api/darkSkyLocations';
import { batchCalculateSiqs } from '@/services/realTimeSiqsService';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Hook to fetch and manage recommended dark sky locations
 * with real-time SIQS calculation
 */
export function useRecommendedLocations() {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const cache = useCache<SharedAstroSpot[]>(30 * 60 * 1000); // 30 minute cache
  const { toast } = useToast();
  const { t } = useLanguage();
  
  useEffect(() => {
    let mounted = true;
    
    const fetchLocations = async () => {
      const cacheKey = 'recommended-locations';
      const cachedData = cache.getItem(cacheKey);
      
      if (cachedData) {
        setLocations(cachedData);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch dark sky locations from API
        const data = await fetchDarkSkyLocations();
        
        if (!mounted) return;
        
        // Calculate real-time SIQS for each location
        const locationsWithSiqs = await batchCalculateSiqs(data);
        
        if (mounted) {
          // Sort by SIQS score (highest first)
          const sortedLocations = locationsWithSiqs.sort((a, b) => 
            (b.siqs || 0) - (a.siqs || 0)
          );
          
          setLocations(sortedLocations);
          cache.setItem(cacheKey, sortedLocations);
        }
      } catch (err) {
        if (mounted) {
          console.error("Error fetching recommended locations:", err);
          setError(err instanceof Error ? err : new Error('Unknown error'));
          
          // Show error toast
          toast({
            title: t ? t("Error loading locations", "加载位置时出错") : "Error loading locations",
            description: t ? t("Could not load recommended locations. Please try again later.", 
                            "无法加载推荐位置。请稍后再试。") : 
                          "Could not load recommended locations. Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    fetchLocations();
    
    return () => {
      mounted = false;
    };
  }, [cache, toast, t]);
  
  /**
   * Refresh the locations data
   */
  const refreshLocations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Clear cache to force fresh data
      cache.removeItem('recommended-locations');
      
      // Fetch fresh data
      const data = await fetchDarkSkyLocations();
      const locationsWithSiqs = await batchCalculateSiqs(data);
      
      // Sort by SIQS score (highest first)
      const sortedLocations = locationsWithSiqs.sort((a, b) => 
        (b.siqs || 0) - (a.siqs || 0)
      );
      
      setLocations(sortedLocations);
      cache.setItem('recommended-locations', sortedLocations);
      
      // Show success toast
      toast({
        title: t ? t("Locations refreshed", "位置已刷新") : "Locations refreshed",
        description: t ? t("Latest dark sky locations loaded with current conditions.", 
                        "已加载最新的暗空位置和当前条件。") : 
                      "Latest dark sky locations loaded with current conditions.",
      });
    } catch (err) {
      console.error("Error refreshing recommended locations:", err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      
      // Show error toast
      toast({
        title: t ? t("Refresh failed", "刷新失败") : "Refresh failed",
        description: t ? t("Could not refresh locations. Please try again later.", 
                        "无法刷新位置。请稍后再试。") : 
                      "Could not refresh locations. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return { 
    locations, 
    loading, 
    error,
    refreshLocations
  };
}


import { useState, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useCalculatedLocationsFind } from '../useCalculatedLocationsFind';
import { isWaterLocation } from '@/utils/validation';
import { toast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const MAX_LOAD_MORE_CLICKS = 2;

export function useCalculatedLocations(
  userLocation: {latitude: number, longitude: number} | null,
  searchRadius: number,
  onLocationSuccess: (locations: SharedAstroSpot[]) => void,
  sortLocationsByQuality: (locations: SharedAstroSpot[]) => SharedAstroSpot[]
) {
  const { t } = useLanguage();
  const { findCalculatedLocations } = useCalculatedLocationsFind();
  
  const [canLoadMoreCalculated, setCanLoadMoreCalculated] = useState<boolean>(false);
  const [loadMoreClickCount, setLoadMoreClickCount] = useState<number>(0);
  
  const loadCalculatedLocations = useCallback(async () => {
    if (!userLocation) return [];
    
    try {
      const calculatedResults = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius
      );
      
      return calculatedResults.filter(loc => 
        !isWaterLocation(loc.latitude, loc.longitude)
      );
    } catch (error) {
      console.error("Error loading calculated locations:", error);
      return [];
    }
  }, [userLocation, searchRadius, findCalculatedLocations]);
  
  const loadMoreCalculatedLocations = useCallback(async (currentLocations: SharedAstroSpot[]) => {
    if (!userLocation || loadMoreClickCount >= MAX_LOAD_MORE_CLICKS) {
      return currentLocations;
    }
    
    try {
      console.log(`Loading more calculated locations, click ${loadMoreClickCount + 1} of ${MAX_LOAD_MORE_CLICKS}`);
      
      const calculatedResults = await findCalculatedLocations(
        userLocation.latitude,
        userLocation.longitude,
        searchRadius
      );
      
      const filteredResults = calculatedResults.filter(loc => 
        !isWaterLocation(loc.latitude, loc.longitude)
      );
      
      const existingCoords = new Set(currentLocations.map(loc => 
        `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`
      ));
      
      const newResults = filteredResults.filter(loc => {
        const coordKey = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
        return !existingCoords.has(coordKey);
      });
      
      if (newResults.length > 0) {
        const allLocations = [...currentLocations, ...newResults];
        const sortedResults = sortLocationsByQuality(allLocations);
        
        const newClickCount = loadMoreClickCount + 1;
        setLoadMoreClickCount(newClickCount);
        
        if (newClickCount >= MAX_LOAD_MORE_CLICKS) {
          setCanLoadMoreCalculated(false);
        }
        
        toast({
          title: t(
            `Added ${newResults.length} more locations`,
            `添加了${newResults.length}个更多位置`
          )
        });
        
        return sortedResults;
      } else {
        toast({
          title: t(
            "No more unique locations found",
            "未找到更多独特位置"
          )
        });
        
        setCanLoadMoreCalculated(false);
        return currentLocations;
      }
    } catch (error) {
      console.error("Error loading more calculated locations:", error);
      toast({
        variant: "destructive",
        title: t(
          "Failed to load more locations",
          "加载更多位置失败"
        )
      });
      return currentLocations;
    }
  }, [loadMoreClickCount, t, userLocation, searchRadius, findCalculatedLocations, sortLocationsByQuality]);
  
  const resetState = useCallback(() => {
    setCanLoadMoreCalculated(true);
    setLoadMoreClickCount(0);
  }, []);
  
  return {
    loadCalculatedLocations,
    loadMoreCalculatedLocations,
    canLoadMoreCalculated,
    loadMoreClickCount,
    maxLoadMoreClicks: MAX_LOAD_MORE_CLICKS,
    resetCalculatedState: resetState
  };
}

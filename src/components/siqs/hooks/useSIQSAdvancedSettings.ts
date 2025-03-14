
import { useState, useEffect, useCallback } from "react";
import { useLocationDataCache } from "@/hooks/useLocationData";

interface LocationData {
  seeingConditions?: number;
  bortleScale?: number;
}

export default function useSIQSAdvancedSettings(latitude: number, longitude: number) {
  const [seeingConditions, setSeeingConditions] = useState<number>(2.5);
  const [bortleScale, setBortleScale] = useState<number>(4);
  const { getCachedData, setCachedData } = useLocationDataCache();

  useEffect(() => {
    const cacheKey = `loc-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    const cachedData = getCachedData(cacheKey) as LocationData | null;

    if (cachedData) {
      if (typeof cachedData.seeingConditions === 'number') {
        setSeeingConditions(cachedData.seeingConditions);
      }
      
      if (typeof cachedData.bortleScale === 'number') {
        setBortleScale(cachedData.bortleScale);
      }
    }
  }, [latitude, longitude, getCachedData]);

  const updateSeeingConditions = useCallback((value: number) => {
    setSeeingConditions(value);
    
    const cacheKey = `loc-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    const cachedData = getCachedData(cacheKey) as LocationData | null;
    
    setCachedData(cacheKey, {
      ...cachedData,
      seeingConditions: value
    });
  }, [latitude, longitude, getCachedData, setCachedData]);

  const updateBortleScale = useCallback((value: number) => {
    setBortleScale(value);
    
    const cacheKey = `loc-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
    const cachedData = getCachedData(cacheKey) as LocationData | null;
    
    setCachedData(cacheKey, {
      ...cachedData,
      bortleScale: value
    });
  }, [latitude, longitude, getCachedData, setCachedData]);

  return {
    seeingConditions,
    bortleScale,
    updateSeeingConditions,
    updateBortleScale
  };
}

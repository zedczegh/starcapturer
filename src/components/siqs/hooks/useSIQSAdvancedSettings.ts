
import { useMemo } from "react";
import { useLocationDataCache } from "@/hooks/useLocationData";

export const useSIQSAdvancedSettings = () => {
  const { getCachedData } = useLocationDataCache();
  
  // Get settings from cache if available, otherwise use defaults
  return useMemo(() => {
    try {
      const cachedSettings = getCachedData('siqs_settings', 30 * 24 * 60 * 60 * 1000); // 30 day cache
      
      // Use cached settings or defaults
      return {
        seeingConditions: cachedSettings?.seeingConditions ?? 2,
        bortleScale: cachedSettings?.bortleScale ?? 4
      };
    } catch (error) {
      console.error("Error retrieving SIQS settings:", error);
      // Fallback to defaults
      return {
        seeingConditions: 2,
        bortleScale: 4
      };
    }
  }, [getCachedData]);
};

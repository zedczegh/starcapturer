
import { useMemo } from "react";
import { useLocationDataCache } from "@/hooks/useLocationData";

export const useSIQSAdvancedSettings = () => {
  const { getCachedData } = useLocationDataCache();
  
  // Get settings from cache if available, otherwise use defaults
  return useMemo(() => {
    try {
      // First, check for specific location settings in cache
      const cachedSettings = getCachedData('siqs_settings', 30 * 24 * 60 * 60 * 1000); // 30 day cache
      
      // Use cached settings or defaults with improved defaults based on average conditions
      return {
        seeingConditions: cachedSettings?.seeingConditions ?? 2.5, // Better default based on average global seeing conditions
        bortleScale: cachedSettings?.bortleScale ?? 4.5  // More accurate default for suburban areas
      };
    } catch (error) {
      console.error("Error retrieving SIQS settings:", error);
      // Fallback to defaults
      return {
        seeingConditions: 2.5,
        bortleScale: 4.5
      };
    }
  }, [getCachedData]);
};

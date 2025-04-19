
import { useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { loadCalculatedLocations } from "@/services/location/optimizedLocationLoader";
import { isSiqsAtLeast } from "@/utils/siqsHelpers";

export const useCalculatedLocationsFind = () => {
  const { t } = useLanguage();

  const findCalculatedLocationsWithinRadius = useCallback(
    async (
      latitude: number,
      longitude: number,
      radius: number,
      allowExpansion: boolean = true,
      limit: number = 10,
      preservePrevious: boolean = false,
      previousLocations: SharedAstroSpot[] = []
    ): Promise<SharedAstroSpot[]> => {
      try {
        console.log(`Finding calculated locations within ${radius}km of [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);
        
        // Get new locations using optimized loader
        const newLocations = await loadCalculatedLocations(
          latitude, 
          longitude, 
          radius,
          limit
        );
        
        if (preservePrevious && previousLocations.length > 0) {
          // Use Set for faster duplication check
          const existingCoords = new Set(
            previousLocations.map(loc => `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`)
          );
          
          // Filter new locations efficiently
          const uniqueNewLocations = newLocations.filter(loc => {
            const coordKey = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
            return !existingCoords.has(coordKey) && isSiqsAtLeast(loc.siqs, 5);
          });
          
          return [...previousLocations, ...uniqueNewLocations];
        }
        
        return newLocations.filter(loc => isSiqsAtLeast(loc.siqs, 5));
      } catch (error) {
        console.error("Error finding calculated locations:", error);
        toast.error(t(
          "Failed to find calculated locations",
          "无法找到计算位置"
        ));
        return [];
      }
    }, 
    [t]
  );

  return {
    findCalculatedLocations: findCalculatedLocationsWithinRadius
  };
};

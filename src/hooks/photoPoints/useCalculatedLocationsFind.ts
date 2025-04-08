
import { useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { findCalculatedLocations } from "@/services/locationSearchService";

export const useCalculatedLocationsFind = () => {
  const { t } = useLanguage();

  /**
   * Find calculated locations within a specified radius
   */
  const findCalculatedLocationsWithinRadius = useCallback(
    async (
      latitude: number,
      longitude: number,
      radius: number
    ): Promise<SharedAstroSpot[]> => {
      try {
        console.log(`Finding calculated locations within ${radius}km of [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);
        
        // Get new locations from the service - only using the required parameters
        // Updated to match the correct function signature
        const newLocations = await findCalculatedLocations(
          latitude, 
          longitude, 
          radius
        );
        
        // Cast to ensure type compatibility
        return newLocations as SharedAstroSpot[];
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


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
      radius: number,
      allowExpansion: boolean = true,
      limit: number = 10,
      preservePrevious: boolean = false,
      previousLocations: SharedAstroSpot[] = []
    ): Promise<SharedAstroSpot[]> => {
      try {
        console.log(`Finding calculated locations within ${radius}km of [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);
        
        // Get new locations from the service
        const newLocations = await findCalculatedLocations(
          latitude, 
          longitude, 
          radius,
          allowExpansion,
          limit
        );
        
        if (preservePrevious && previousLocations.length > 0) {
          console.log(`Preserving ${previousLocations.length} previous locations`);
          
          // Create a Set of location coordinates for quick lookup
          const existingCoords = new Set(
            previousLocations.map(loc => `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`)
          );
          
          // Filter out locations we already have
          const uniqueNewLocations = newLocations.filter(loc => {
            const coordKey = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
            return !existingCoords.has(coordKey);
          });
          
          // Combine previous and new locations
          console.log(`Adding ${uniqueNewLocations.length} new unique locations to ${previousLocations.length} existing ones`);
          return [...previousLocations, ...uniqueNewLocations];
        }
        
        return newLocations;
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

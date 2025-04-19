
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { loadCalculatedLocations, addLocationUpdateListener } from "@/services/location/optimizedLocationLoader";
import { isSiqsAtLeast } from "@/utils/siqsHelpers";

export const useCalculatedLocationsFind = () => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchParams, setLastSearchParams] = useState<{
    latitude: number;
    longitude: number;
    radius: number;
  } | null>(null);

  // Setup location update listener
  useEffect(() => {
    return addLocationUpdateListener(() => {
      // If we have previous search params, reload data when locations are updated elsewhere
      if (lastSearchParams) {
        console.log("Location update detected, refreshing calculated locations");
        // We don't set loading state here to prevent UI flashing when it's just a background refresh
      }
    });
  }, [lastSearchParams]);

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
        // Track if this is a new location search
        const isNewLocation = !lastSearchParams || 
          Math.abs(lastSearchParams.latitude - latitude) > 0.001 ||
          Math.abs(lastSearchParams.longitude - longitude) > 0.001 ||
          lastSearchParams.radius !== radius;

        // Only show loading state for new location searches
        if (isNewLocation) {
          setIsLoading(true);
          console.log(`Finding calculated locations within ${radius}km of [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);
        }
        
        // Update last search params
        setLastSearchParams({ latitude, longitude, radius });
        
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
      } finally {
        setIsLoading(false);
      }
    }, 
    [t, lastSearchParams]
  );

  return {
    findCalculatedLocations: findCalculatedLocationsWithinRadius,
    isLoading
  };
};

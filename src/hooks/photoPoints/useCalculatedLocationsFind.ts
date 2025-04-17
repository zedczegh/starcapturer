import { useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { findCalculatedLocations } from "@/services/locationSearchService";
import { isSiqsAtLeast } from "@/utils/siqsHelpers";
import { calculateAstronomicalNight, formatTime } from "@/utils/astronomy/nightTimeCalculator";

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
        
        // Process locations to add astronomical night data
        const processedLocations = newLocations.map(location => {
          try {
            if (location.latitude && location.longitude) {
              // Calculate astronomical night for this location
              const { start, end } = calculateAstronomicalNight(location.latitude, location.longitude);
              const nightTimeStr = formatTime(start) + "-" + formatTime(end);
              
              // Add the data to the location object
              location.metadata = location.metadata || {};
              location.metadata.astronomicalNight = {
                start: start.toISOString(),
                end: end.toISOString(),
                formattedTime: nightTimeStr
              };
            }
            return location;
          } catch (err) {
            console.error("Error calculating astronomical night for location:", err);
            return location;
          }
        });
        
        if (preservePrevious && previousLocations.length > 0) {
          console.log(`Preserving ${previousLocations.length} previous locations`);
          
          // Create a Set of location coordinates for quick lookup
          const existingCoords = new Set(
            previousLocations.map(loc => `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`)
          );
          
          // Filter out locations we already have
          const uniqueNewLocations = processedLocations.filter(loc => {
            const coordKey = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
            return !existingCoords.has(coordKey);
          });
          
          // Filter out locations with SIQS below 5
          const qualityFilteredLocations = uniqueNewLocations.filter(loc => {
            // If siqs is null/undefined or >= 5, keep the location
            return loc.siqs === undefined || loc.siqs === null || isSiqsAtLeast(loc.siqs, 5);
          });
          
          // Combine previous and new locations
          console.log(`Adding ${qualityFilteredLocations.length} new unique locations to ${previousLocations.length} existing ones`);
          return [...previousLocations, ...qualityFilteredLocations];
        }
        
        // Filter new locations by quality
        const qualityFilteredLocations = processedLocations.filter(loc => {
          // If siqs is null/undefined or >= 5, keep the location
          return loc.siqs === undefined || loc.siqs === null || isSiqsAtLeast(loc.siqs, 5);
        });
        
        return qualityFilteredLocations;
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

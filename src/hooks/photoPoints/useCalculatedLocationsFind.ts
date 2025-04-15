import { useCallback } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { findCalculatedLocations } from "@/services/locationSearchService";
import { isValidAstronomyLocation } from "@/utils/locationValidator";

interface SiqsObject {
  score: number;
  isViable?: boolean;
}

type Siqs = number | SiqsObject;

export const useCalculatedLocationsFind = () => {
  const { t } = useLanguage();

  /**
   * Find calculated locations within a specified radius
   * Enhanced with stronger water location filtering
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
        
        // Apply additional land-only filtering
        const landOnlyLocations = newLocations.filter(loc => 
          // Skip locations with invalid coordinates
          loc.latitude && loc.longitude && 
          // Apply enhanced land verification
          isValidAstronomyLocation(loc.latitude, loc.longitude, loc.name)
        );
        
        console.log(`Filtered from ${newLocations.length} to ${landOnlyLocations.length} land-only locations`);
        
        if (preservePrevious && previousLocations.length > 0) {
          console.log(`Preserving ${previousLocations.length} previous locations`);
          
          // Create a Set of location coordinates for quick lookup
          const existingCoords = new Set(
            previousLocations.map(loc => `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`)
          );
          
          // Filter out locations we already have
          const uniqueNewLocations = landOnlyLocations.filter(loc => {
            const coordKey = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
            return !existingCoords.has(coordKey);
          });
          
          // Filter out locations with SIQS below 5
          const qualityFilteredLocations = uniqueNewLocations.filter(loc => {
            // If siqs is null/undefined or >= 5, keep the location
            let siqsScore = 0;
            
            // Safely handle different SIQS formats
            if (typeof loc.siqs === 'number') {
              siqsScore = loc.siqs;
            } else if (loc.siqs && typeof loc.siqs === 'object') {
              siqsScore = (loc.siqs as SiqsObject).score;
            }
            
            return siqsScore === undefined || siqsScore === null || siqsScore >= 5;
          });
          
          // Combine previous and new locations
          console.log(`Adding ${qualityFilteredLocations.length} new unique locations to ${previousLocations.length} existing ones`);
          return [...previousLocations, ...qualityFilteredLocations];
        }
        
        // Filter new locations by quality
        const qualityFilteredLocations = landOnlyLocations.filter(loc => {
          // If siqs is null/undefined or >= 5, keep the location
          let siqsScore = 0;
          
          // Safely handle different SIQS formats
          if (typeof loc.siqs === 'number') {
            siqsScore = loc.siqs;
          } else if (loc.siqs && typeof loc.siqs === 'object') {
            siqsScore = (loc.siqs as SiqsObject).score;
          }
          
          return siqsScore === undefined || siqsScore === null || siqsScore >= 5;
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

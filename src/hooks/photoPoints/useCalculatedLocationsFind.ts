
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { findCalculatedLocations } from "@/services/locationSearchService";

export const useCalculatedLocationsFind = () => {
  const { t } = useLanguage();
  const [lastRegionData, setLastRegionData] = useState<{
    latitude: number;
    longitude: number;
    radius: number;
    timestamp: number;
    nighttimeCloudCover?: number;
  } | null>(null);

  /**
   * Find calculated locations within a specified radius with optimized filtering
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
        
        // Check if we already have region data from a recent search
        const now = Date.now();
        const regionDataExpired = !lastRegionData || 
          now - lastRegionData.timestamp > 10 * 60 * 1000 || // 10 minutes
          Math.abs(lastRegionData.latitude - latitude) > 0.1 || 
          Math.abs(lastRegionData.longitude - longitude) > 0.1 || 
          lastRegionData.radius !== radius;

        // Pre-filter with regional nighttime data to minimize API calls
        let regionNighttimeCloudCover: number | undefined = undefined;
        if (!regionDataExpired && lastRegionData.nighttimeCloudCover !== undefined) {
          regionNighttimeCloudCover = lastRegionData.nighttimeCloudCover;
          console.log(`Using cached region nighttime cloud cover: ${regionNighttimeCloudCover}%`);
        } else {
          // Only get nighttime data if it's night (7 PM to 6 AM)
          const hour = new Date().getHours();
          const isNighttime = hour >= 19 || hour <= 6;
          
          if (isNighttime) {
            try {
              // Get regional cloud cover data just once
              const { findNearestTowns } = await import('@/utils/locationUtils');
              const { getNighttimeCloudCover } = await import('@/utils/weatherUtils');
              
              // Find 2 nearest towns to get regional data instead of per-location
              const nearbyTowns = await findNearestTowns(latitude, longitude, 2);
              
              if (nearbyTowns && nearbyTowns.length > 0) {
                const townCloudCovers = await Promise.all(
                  nearbyTowns.map(town => 
                    getNighttimeCloudCover(town.latitude, town.longitude).catch(() => null)
                  )
                );
                
                // Calculate average from valid results
                const validCloudCovers = townCloudCovers.filter(cc => cc !== null) as number[];
                if (validCloudCovers.length > 0) {
                  regionNighttimeCloudCover = validCloudCovers.reduce((sum, cc) => sum + cc, 0) / validCloudCovers.length;
                  console.log(`Regional nighttime cloud cover: ${regionNighttimeCloudCover?.toFixed(1)}%`);
                  
                  // Save for future use
                  setLastRegionData({
                    latitude,
                    longitude,
                    radius,
                    timestamp: now,
                    nighttimeCloudCover: regionNighttimeCloudCover
                  });
                }
              }
            } catch (error) {
              console.error("Error getting regional nighttime data:", error);
            }
          }
        }
        
        // Get new locations from the service with optimized parameters
        const newLocations = await findCalculatedLocations(
          latitude, 
          longitude, 
          radius,
          allowExpansion,
          limit,
          regionNighttimeCloudCover // Pass regional cloud cover data to optimize filtering
        );
        
        // Filter out locations with SIQS less than 5
        const filteredLocations = newLocations.filter(loc => 
          (typeof loc.siqs === 'number' && loc.siqs >= 5) || 
          (typeof loc.siqs === 'object' && loc.siqs?.score >= 5) ||
          loc.isDarkSkyReserve || 
          loc.certification
        );
        
        if (preservePrevious && previousLocations.length > 0) {
          console.log(`Preserving ${previousLocations.length} previous locations`);
          
          // Create a Set of location coordinates for quick lookup
          const existingCoords = new Set(
            previousLocations.map(loc => `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`)
          );
          
          // Filter out locations we already have
          const uniqueNewLocations = filteredLocations.filter(loc => {
            const coordKey = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;
            return !existingCoords.has(coordKey);
          });
          
          // Combine previous and new locations
          console.log(`Adding ${uniqueNewLocations.length} new unique locations to ${previousLocations.length} existing ones`);
          return [...previousLocations, ...uniqueNewLocations];
        }
        
        return filteredLocations;
      } catch (error) {
        console.error("Error finding calculated locations:", error);
        toast.error(t(
          "Failed to find calculated locations",
          "无法找到计算位置"
        ));
        return [];
      }
    }, 
    [t, lastRegionData]
  );

  return {
    findCalculatedLocations: findCalculatedLocationsWithinRadius
  };
};

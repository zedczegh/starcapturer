
import { useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateSiqsForLocation } from '@/lib/siqs/calculator';
import { calculateDistance } from '@/utils/geoUtils';
import { getLightPollution } from '@/utils/lightPollutionData';
import { getWeatherData } from '@/lib/api/weather';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

// Grid search parameters
const GRID_DENSITY = 5; // Points per direction
const BATCH_SIZE = 5; // Number of locations per load

export const useCalculatedLocationsFind = () => {
  const { t } = useLanguage();

  const findCalculatedLocations = useCallback(
    async (
      latitude: number,
      longitude: number,
      radius: number
    ): Promise<SharedAstroSpot[]> => {
      try {
        console.log(`Finding calculated locations around ${latitude}, ${longitude} with radius ${radius}km`);
        
        // Calculate grid step size based on radius
        const gridStep = radius / (GRID_DENSITY - 1);
        
        // Generate grid points
        const gridPoints: { lat: number; lng: number }[] = [];
        
        // Create a grid centered on the user location
        for (let i = 0; i < GRID_DENSITY; i++) {
          for (let j = 0; j < GRID_DENSITY; j++) {
            const lat = latitude - radius/111.32 + (i * 2 * radius/111.32) / (GRID_DENSITY - 1);
            const lng = longitude - radius/(111.32 * Math.cos(latitude * Math.PI/180)) + 
                       (j * 2 * radius/(111.32 * Math.cos(latitude * Math.PI/180))) / (GRID_DENSITY - 1);
            
            // Calculate distance from center
            const distance = calculateDistance(latitude, longitude, lat, lng);
            
            // Only include points within the radius
            if (distance <= radius) {
              gridPoints.push({ lat, lng });
            }
          }
        }
        
        // Process each point to get SIQS in a batch
        const calculatedLocations: SharedAstroSpot[] = [];
        
        // Only process BATCH_SIZE points at a time
        const pointsToProcess = gridPoints.slice(0, BATCH_SIZE);
        
        for (const point of pointsToProcess) {
          try {
            // Get weather data
            const weather = await getWeatherData(point.lat, point.lng);
            
            // Get light pollution data
            const lightPollution = await getLightPollution(point.lat, point.lng);
            
            // Calculate SIQS
            const siqs = await calculateSiqsForLocation({
              latitude: point.lat,
              longitude: point.lng,
              cloudCover: weather?.cloudCover || 0,
              lightPollution: lightPollution || 0
            });
            
            // Calculate distance from user
            const distance = calculateDistance(latitude, longitude, point.lat, point.lng);
            
            // Create location object
            const location: SharedAstroSpot = {
              id: `calc-${point.lat.toFixed(6)}-${point.lng.toFixed(6)}`,
              latitude: point.lat,
              longitude: point.lng,
              name: `${t("Calculated Point", "计算点")} (${point.lat.toFixed(4)}, ${point.lng.toFixed(4)})`,
              siqs: siqs,
              distance: distance,
              timestamp: new Date().toISOString(),
              // Add a custom property to distinguish these as calculated points
              certification: null,
              isDarkSkyReserve: false
            };
            
            calculatedLocations.push(location);
          } catch (error) {
            console.error(`Error processing grid point ${point.lat}, ${point.lng}:`, error);
            // Continue with next point
          }
        }
        
        // Sort by SIQS score (highest first)
        return calculatedLocations.sort((a, b) => {
          const siqsA = typeof a.siqs === 'number' ? a.siqs : (a.siqs?.score || 0);
          const siqsB = typeof b.siqs === 'number' ? b.siqs : (b.siqs?.score || 0);
          return siqsB - siqsA;
        });
      } catch (error) {
        console.error('Error finding calculated locations:', error);
        toast.error(t("Failed to calculate locations", "无法计算位置"));
        return [];
      }
    },
    [t]
  );

  return { findCalculatedLocations };
};

import { useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { calculateSiqsForLocation } from '@/lib/siqs/calculator';
import { calculateDistance } from '@/utils/geoUtils';
import { getElevation } from '@/services/elevationService';
import { getWeatherData } from '@/services/weatherService';
import { getLightPollution } from '@/services/lightPollutionService';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

// Grid search parameters
const GRID_DENSITY = 5; // Points per direction (total points = GRID_DENSITY^2)
const MAX_POINTS = 100; // Maximum number of points to return

export const useCalculatedLocationsFind = () => {
  const { t } = useLanguage();

  const findCalculatedLocations = useCallback(
    async (
      latitude: number,
      longitude: number,
      radius: number,
      limit: number
    ): Promise<SharedAstroSpot[]> => {
      try {
        console.log(`Finding calculated locations around ${latitude}, ${longitude} with radius ${radius}km, limit ${limit}`);
        
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
        
        // Limit the number of points to process
        const limitedPoints = gridPoints.slice(0, Math.min(gridPoints.length, MAX_POINTS));
        
        console.log(`Generated ${limitedPoints.length} grid points within ${radius}km radius`);
        
        // Process each point to get SIQS
        const calculatedLocations: SharedAstroSpot[] = [];
        
        for (const point of limitedPoints) {
          try {
            // Get elevation data
            const elevation = await getElevation(point.lat, point.lng);
            
            // Get weather data
            const weather = await getWeatherData(point.lat, point.lng);
            
            // Get light pollution data
            const lightPollution = await getLightPollution(point.lat, point.lng);
            
            // Calculate SIQS
            const siqs = calculateSiqsForLocation({
              latitude: point.lat,
              longitude: point.lng,
              elevation: elevation || 0,
              cloudCover: weather?.cloudCover || 0,
              lightPollution: lightPollution || 0,
            });
            
            // Calculate distance from user
            const distance = calculateDistance(latitude, longitude, point.lat, point.lng);
            
            // Create location object
            const location: SharedAstroSpot = {
              id: `calc-${point.lat.toFixed(6)}-${point.lng.toFixed(6)}`,
              latitude: point.lat,
              longitude: point.lng,
              elevation: elevation || 0,
              name: `${t("Calculated Point", "计算点")} (${point.lat.toFixed(4)}, ${point.lng.toFixed(4)})`,
              siqs: siqs,
              distance: distance,
              timestamp: new Date().toISOString(),
              isCalculated: true
            };
            
            calculatedLocations.push(location);
          } catch (error) {
            console.error(`Error processing grid point ${point.lat}, ${point.lng}:`, error);
            // Continue with next point
          }
        }
        
        // Sort by SIQS score (highest first)
        const sortedLocations = calculatedLocations.sort((a, b) => {
          const siqsA = typeof a.siqs === 'number' ? a.siqs : (a.siqs?.score || 0);
          const siqsB = typeof b.siqs === 'number' ? b.siqs : (b.siqs?.score || 0);
          return siqsB - siqsA;
        });
        
        // Limit the number of locations returned
        return sortedLocations.slice(0, limit);
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

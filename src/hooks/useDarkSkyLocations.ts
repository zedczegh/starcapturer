
import { useState, useEffect } from 'react';
import { SharedAstroSpot, getSharedAstroSpots } from '@/lib/api/astroSpots';
import { calculateDistance } from '@/data/utils/distanceCalculator';

interface UseDarkSkyLocationsResult {
  darkSkyLocations: SharedAstroSpot[];
  isDarkSkyLoading: boolean;
}

export function useDarkSkyLocations(
  coordinates: { latitude: number; longitude: number } | null
): UseDarkSkyLocationsResult {
  const [darkSkyLocations, setDarkSkyLocations] = useState<SharedAstroSpot[]>([]);
  const [isDarkSkyLoading, setIsDarkSkyLoading] = useState(true);

  useEffect(() => {
    if (!coordinates) {
      setIsDarkSkyLoading(false);
      return;
    }

    const fetchDarkSkyLocations = async () => {
      setIsDarkSkyLoading(true);
      try {
        // Get dark sky locations from API
        const locations = await getSharedAstroSpots(
          coordinates.latitude,
          coordinates.longitude,
          20,
          5000 // Larger radius to find dark sky locations globally
        );
        
        // Filter only dark sky certified locations
        const darkSkyOnly = locations.filter(location => location.isDarkSkyReserve);
        
        // Add distance calculation
        const locationsWithDistance = darkSkyOnly.map(location => ({
          ...location,
          distance: calculateDistance(
            coordinates.latitude,
            coordinates.longitude,
            location.latitude,
            location.longitude
          )
        }));
        
        // Sort by SIQS score
        const sortedLocations = locationsWithDistance.sort((a, b) => {
          // Use safe number comparison
          const scoreA = typeof a.siqs === 'number' ? a.siqs : 
            (typeof a.siqs === 'object' && a.siqs !== null ? (a.siqs as any).score || 0 : 0);
          const scoreB = typeof b.siqs === 'number' ? b.siqs : 
            (typeof b.siqs === 'object' && b.siqs !== null ? (b.siqs as any).score || 0 : 0);
          
          return scoreB - scoreA;
        });
        
        setDarkSkyLocations(sortedLocations);
      } catch (error) {
        console.error("Error fetching dark sky locations:", error);
      } finally {
        setIsDarkSkyLoading(false);
      }
    };

    fetchDarkSkyLocations();
  }, [coordinates]);

  return { darkSkyLocations, isDarkSkyLoading };
}

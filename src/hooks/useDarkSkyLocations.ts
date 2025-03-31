
import { useState, useEffect, useRef } from 'react';
import { SharedAstroSpot, getSharedAstroSpots } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export function useDarkSkyLocations(coordinates?: { latitude: number; longitude: number }) {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const { language } = useLanguage();
  const lastFetchedCoordinatesRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  // Create a unique signature for coordinates to prevent unnecessary fetches
  const getCoordinateSignature = (coords?: { latitude: number; longitude: number }) => {
    if (!coords) return null;
    return `${coords.latitude.toFixed(4)}-${coords.longitude.toFixed(4)}`;
  };

  useEffect(() => {
    // Set mounted ref for cleanup
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchDarkSkyLocations = async () => {
      if (!coordinates) {
        setLoading(false);
        return;
      }

      // Get coordinate signature
      const coordSignature = getCoordinateSignature(coordinates);
      
      // Skip if we've already fetched this location
      if (coordSignature === lastFetchedCoordinatesRef.current && locations.length > 0) {
        setLoading(false);
        return;
      }
      
      // Update the last fetched coordinates
      lastFetchedCoordinatesRef.current = coordSignature;

      try {
        setLoading(true);
        // Get locations within a larger radius to ensure we capture dark sky reserves
        const allLocations = await getSharedAstroSpots(
          coordinates.latitude, 
          coordinates.longitude,
          20, // Limit to 20 locations for better performance
          10000 // 10000km radius to get worldwide dark sky locations
        );
        
        // Filter to only show dark sky reserves
        const darkSkyLocations = allLocations.filter(loc => loc.isDarkSkyReserve);
        
        // Sort by distance
        const sortedLocations = darkSkyLocations.sort((a, b) => 
          (a.distance || Infinity) - (b.distance || Infinity)
        );
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setLocations(sortedLocations);
        }
      } catch (error) {
        console.error('Error fetching dark sky locations:', error);
        
        if (isMountedRef.current) {
          // Show error toast only if first attempt
          if (locations.length === 0) {
            toast.error(
              language === 'en' 
                ? 'Failed to load dark sky locations' 
                : '加载暗夜区域失败',
              { description: language === 'en' ? 'Please try again later' : '请稍后再试' }
            );
          }
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchDarkSkyLocations();
  }, [coordinates, language, locations.length]);

  return { 
    darkSkyLocations: locations,
    isDarkSkyLoading: loading 
  };
}

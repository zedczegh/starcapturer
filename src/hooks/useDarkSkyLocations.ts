
import { useState, useEffect } from 'react';
import { SharedAstroSpot, getSharedAstroSpots } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export function useDarkSkyLocations(coordinates?: { latitude: number; longitude: number }) {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchDarkSkyLocations = async () => {
      if (!coordinates) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get locations within a larger radius to ensure we capture dark sky reserves
        const allLocations = await getSharedAstroSpots(
          coordinates.latitude, 
          coordinates.longitude,
          20, // Limit to 20 locations for better performance
          5000 // 5000km radius to get worldwide dark sky locations
        );
        
        // Filter to only show dark sky reserves
        const darkSkyLocations = allLocations.filter(loc => loc.isDarkSkyReserve);
        
        // Sort by distance
        const sortedLocations = darkSkyLocations.sort((a, b) => 
          (a.distance || Infinity) - (b.distance || Infinity)
        );
        
        setLocations(sortedLocations);
      } catch (error) {
        console.error('Error fetching dark sky locations:', error);
        toast.error(
          language === 'en' 
            ? 'Failed to load dark sky locations' 
            : '加载暗夜区域失败',
          { description: language === 'en' ? 'Please try again later' : '请稍后再试' }
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDarkSkyLocations();
  }, [coordinates, language, t]);

  return { 
    darkSkyLocations: locations,
    isDarkSkyLoading: loading 
  };
}


import { useState, useEffect, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useDebounce } from '@/hooks/useDebounce';

export const usePhotoPoints = (
  userLocation: { latitude: number; longitude: number } | null,
  searchRadius: number = 100
) => {
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const debouncedRadius = useDebounce(searchRadius, 500);
  
  const fetchLocations = useCallback(async () => {
    if (!userLocation) {
      setLocations([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      // Mock locations for now - in a real app, you would fetch from an API
      const mockLocations: SharedAstroSpot[] = [
        {
          id: 'location-1',
          name: 'Test Location',
          latitude: userLocation.latitude + 0.1,
          longitude: userLocation.longitude + 0.1,
          bortleScale: 3,
          siqs: 7.5,
          timestamp: new Date().toISOString()
        }
      ];
      
      setLocations(mockLocations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [userLocation]);
  
  // Fetch locations when user location or search radius changes
  useEffect(() => {
    fetchLocations();
  }, [userLocation, debouncedRadius, fetchLocations]);
  
  return { locations, loading, refreshLocations: fetchLocations };
};

export default usePhotoPoints;


import { useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface UserLocationSiqsProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
}

/**
 * Hook to find the SIQS score at the user's location
 */
export const useUserLocationSiqs = ({ userLocation, locations }: UserLocationSiqsProps) => {
  // Find the current SIQS at the user location
  const currentSiqs = useMemo(() => {
    if (!userLocation || !locations || locations.length === 0) {
      return null;
    }
    
    // First check if user location is in the locations list
    const exactMatch = locations.find(loc => 
      loc.latitude === userLocation.latitude && 
      loc.longitude === userLocation.longitude
    );
    
    if (exactMatch && typeof exactMatch.siqs === 'number') {
      return exactMatch.siqs;
    }
    
    // Then look for locations that are very close (within 50 meters)
    // Using approximate distance calculation for speed
    const closeMatch = locations.find(loc => {
      if (!loc.latitude || !loc.longitude || !loc.siqs) return false;
      
      const latDiff = Math.abs(loc.latitude - userLocation.latitude);
      const lngDiff = Math.abs(loc.longitude - userLocation.longitude);
      
      // Rough approximation: 0.0005 degrees is about 50 meters
      return latDiff < 0.0005 && lngDiff < 0.0005;
    });
    
    if (closeMatch && typeof closeMatch.siqs === 'number') {
      return closeMatch.siqs;
    }
    
    return null;
  }, [userLocation, locations]);
  
  return { currentSiqs };
};

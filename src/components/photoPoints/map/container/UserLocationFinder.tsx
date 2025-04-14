
import { useState, useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface UserLocationFinderProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
}

/**
 * Hook to find user location SIQS from available locations
 */
export const useUserLocationSiqs = ({ 
  userLocation, 
  locations 
}: UserLocationFinderProps) => {
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  
  // Find user location SIQS
  useEffect(() => {
    if (userLocation && locations.length > 0) {
      const userLat = userLocation.latitude;
      const userLng = userLocation.longitude;
      
      // Find siqs of current user location from locations
      const sameLocation = locations.find(loc => 
        Math.abs(loc.latitude - userLat) < 0.0001 && 
        Math.abs(loc.longitude - userLng) < 0.0001
      );
      
      if (sameLocation && sameLocation.siqs) {
        setCurrentSiqs(sameLocation.siqs);
      } else {
        setCurrentSiqs(null);
      }
    }
  }, [userLocation, locations]);
  
  return { currentSiqs };
};

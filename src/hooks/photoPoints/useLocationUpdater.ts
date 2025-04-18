
import { useState, useCallback } from 'react';
import { useThrottle } from '../utils/useThrottle';

interface UseLocationUpdaterProps {
  onLocationUpdate?: (latitude: number, longitude: number) => void;
}

export const useLocationUpdater = ({ onLocationUpdate }: UseLocationUpdaterProps) => {
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const throttleLocationUpdate = useThrottle(1000);
  
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onLocationUpdate && !isUpdatingLocation) {
      throttleLocationUpdate(() => {
        setIsUpdatingLocation(true);
        onLocationUpdate(lat, lng);
        setTimeout(() => setIsUpdatingLocation(false), 1000);
      });
    }
  }, [onLocationUpdate, isUpdatingLocation, throttleLocationUpdate]);

  const handleGetLocation = useCallback(() => {
    if (onLocationUpdate && navigator.geolocation && !isUpdatingLocation) {
      throttleLocationUpdate(() => {
        setIsUpdatingLocation(true);
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            onLocationUpdate(latitude, longitude);
            setTimeout(() => setIsUpdatingLocation(false), 1000);
          },
          (error) => {
            console.error("Error getting location:", error.message);
            setIsUpdatingLocation(false);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      });
    }
  }, [onLocationUpdate, isUpdatingLocation, throttleLocationUpdate]);

  return {
    handleMapClick,
    handleGetLocation,
    isUpdatingLocation
  };
};

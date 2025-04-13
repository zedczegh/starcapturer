
import { useState, useEffect, useCallback } from 'react';
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService';

/**
 * Hook for managing location state in photo points pages
 */
export const usePhotoPointsLocation = (
  coords: { latitude: number; longitude: number } | null,
  getPosition: () => void,
  locationError: Error | null
) => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [manualLocationOverride, setManualLocationOverride] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoadAttempts, setLocationLoadAttempts] = useState(0);

  // Try to get user position if not available
  useEffect(() => {
    if (!coords && locationLoadAttempts < 3) {
      console.log("Getting user position, attempt:", locationLoadAttempts + 1);
      const timeoutId = setTimeout(() => {
        getPosition();
        setLocationLoadAttempts(prev => prev + 1);
      }, locationLoadAttempts * 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [getPosition, coords, locationLoadAttempts]);
  
  // Update user location when coords change
  useEffect(() => {
    if (coords && !manualLocationOverride) {
      const newLocation = { latitude: coords.latitude, longitude: coords.longitude };
      setUserLocation(newLocation);
      
      try {
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
        console.log("Updated user location from geolocation:", newLocation);
      } catch (err) {
        console.error("Error saving location to localStorage:", err);
      }
    }
  }, [coords, manualLocationOverride]);
  
  // Try to use saved location if geolocation fails
  useEffect(() => {
    if ((locationError || locationLoadAttempts >= 3) && !userLocation && !manualLocationOverride) {
      try {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
          const parsedLocation = JSON.parse(savedLocation);
          if (parsedLocation && typeof parsedLocation.latitude === 'number' && typeof parsedLocation.longitude === 'number') {
            setUserLocation(parsedLocation);
            console.log("Using saved location from localStorage as fallback:", parsedLocation);
          }
        }
      } catch (err) {
        console.error("Error loading saved location:", err);
      }
    }
  }, [locationError, userLocation, locationLoadAttempts, manualLocationOverride]);

  // Handler for manually updating the location
  const handleLocationUpdate = useCallback((latitude: number, longitude: number) => {
    const newLocation = { latitude, longitude };
    
    setManualLocationOverride(newLocation);
    setUserLocation(newLocation);
    
    try {
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
      console.log("Updated user location from map click:", newLocation);
    } catch (err) {
      console.error("Error saving location to localStorage:", err);
    }
    
    try {
      clearLocationCache();
      console.log("Cleared location cache after location change");
    } catch (err) {
      console.error("Error clearing location cache:", err);
    }
  }, []);

  // Reset to using device location
  const handleResetLocation = useCallback(() => {
    setManualLocationOverride(null);
    if (coords) {
      const newLocation = { latitude: coords.latitude, longitude: coords.longitude };
      setUserLocation(newLocation);
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
    } else {
      getPosition();
    }
  }, [coords, getPosition]);

  // Return both the current effective location and handlers
  return {
    userLocation,
    effectiveLocation: manualLocationOverride || userLocation,
    handleLocationUpdate,
    handleResetLocation
  };
};

export default usePhotoPointsLocation;


import { useState, useEffect, useCallback } from 'react';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

/**
 * Hook for managing user location in the PhotoPoints components
 */
export const useLocationManagement = () => {
  const { t } = useLanguage();
  const { 
    loading: locationLoading, 
    coords, 
    getPosition, 
    error: locationError 
  } = useGeolocation({
    enableHighAccuracy: true,
    maximumAge: 60000, // Use cached position for 1 minute
    timeout: 10000 // Timeout after 10 seconds
  });
  
  const [locationLoadAttempts, setLocationLoadAttempts] = useState(0);
  const [manualLocationOverride, setManualLocationOverride] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Get position if not available
  useEffect(() => {
    if (!coords && locationLoadAttempts < 3) {
      console.log("Getting user position, attempt:", locationLoadAttempts + 1);
      const timeoutId = setTimeout(() => {
        getPosition();
        setLocationLoadAttempts(prev => prev + 1);
      }, locationLoadAttempts * 1000); // Increase delay with each attempt
      
      return () => clearTimeout(timeoutId);
    }
  }, [getPosition, coords, locationLoadAttempts]);
  
  // Update user location from coords if no override
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
  
  // Fall back to saved location if geolocation fails
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
  
  // Compute effective location (override or user location)
  const effectiveLocation = manualLocationOverride || userLocation;
  
  // Handle reset to current location
  const handleResetLocation = useCallback(() => {
    setManualLocationOverride(null);
    if (coords) {
      const newLocation = { latitude: coords.latitude, longitude: coords.longitude };
      setUserLocation(newLocation);
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
      toast.success(t("Reset to current location", "重置为当前位置"));
    } else {
      getPosition();
      toast.info(t("Getting your location...", "获取您的位置中..."));
    }
  }, [coords, getPosition, t]);

  return {
    userLocation,
    setUserLocation,
    manualLocationOverride,
    setManualLocationOverride,
    effectiveLocation,
    locationLoading,
    locationLoadAttempts,
    handleResetLocation
  };
};

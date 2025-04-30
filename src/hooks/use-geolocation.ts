
import { useState, useEffect, useCallback } from 'react';

interface GeolocationHookReturnType {
  location: {latitude: number, longitude: number} | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  getPosition: () => void;
}

export const useGeolocation = (): GeolocationHookReturnType => {
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
    setError(null);
    setLoading(false);
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    setError(error);
    setLoading(false);
    console.error('Error getting location:', error.message);
  }, []);

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      });
      return;
    }
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 60000 // 1 minute
      }
    );
  }, [handleSuccess, handleError]);

  useEffect(() => {
    getPosition();
  }, [getPosition]);

  return { location, error, loading, getPosition };
};

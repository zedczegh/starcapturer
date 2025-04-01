
import { useState, useEffect, useCallback } from 'react';

// Define proper GeolocationOptions without language property
export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options?: GeolocationOptions) => {
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Success handler for geolocation
  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setCoords(position.coords);
    setError(null);
    setLoading(false);
  }, []);

  // Error handler for geolocation
  const handleError = useCallback((error: GeolocationPositionError) => {
    setError(error);
    setLoading(false);
    console.error("Geolocation error:", error.message);
  }, []);

  // Function to get current position
  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError({ 
        code: 0, 
        message: "Geolocation not supported by this browser", 
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
      options
    );
  }, [handleSuccess, handleError, options]);

  // Get position on mount if options.enableHighAccuracy is true
  useEffect(() => {
    if (options?.enableHighAccuracy) {
      getPosition();
    }
  }, [getPosition, options]);

  return { coords, error, loading, getPosition };
};

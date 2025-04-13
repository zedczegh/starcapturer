
import { useState, useEffect, useCallback, useRef } from "react";

export const useGeolocation = (options = {}) => {
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState(false);
  const requestedRef = useRef(false); // Track if we've already requested position
  
  const onSuccess = (position: GeolocationPosition) => {
    setLoading(false);
    setCoords(position.coords);
    setError(null);
  };

  const onError = (error: GeolocationPositionError) => {
    setLoading(false);
    setError(error);
    console.warn(`Error getting geolocation: ${error.message}`);
  };

  const getPosition = useCallback(() => {
    // Prevent multiple simultaneous requests
    if (requestedRef.current) return;
    
    const { geolocation } = navigator;
    
    if (!geolocation) {
      setError(new Error("Geolocation is not supported") as any);
      return;
    }

    setLoading(true);
    requestedRef.current = true; // Mark as requested
    
    geolocation.getCurrentPosition(
      onSuccess,
      onError,
      options
    );
  }, [options]);

  useEffect(() => {
    // Clear request flag when component unmounts
    return () => {
      requestedRef.current = false;
    };
  }, []);

  return { coords, error, loading, getPosition };
};

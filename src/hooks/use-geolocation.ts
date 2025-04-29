
import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  coords: GeolocationCoordinates | null;
  error: GeolocationPositionError | null;
  loading: boolean;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    loading: true,
  });

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: {
          code: 0,
          message: 'Geolocation not supported',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        } as GeolocationPositionError,
        loading: false
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: position.coords,
          error: null,
          loading: false,
        });
      },
      (error) => {
        setState({
          coords: null,
          error,
          loading: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }, []);

  useEffect(() => {
    getPosition();
  }, []);

  return {
    ...state,
    getPosition,
  };
};


import { useState, useEffect } from 'react';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  timestamp: number | null;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
    timestamp: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(s => ({
        ...s,
        error: {
          code: 0,
          message: 'Geolocation is not supported',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        } as GeolocationPositionError,
        loading: false,
      }));
      return;
    }

    const geoWatchId = navigator.geolocation.watchPosition(
      position => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          timestamp: position.timestamp,
        });
      },
      error => {
        setState(s => ({
          ...s,
          error,
          loading: false,
        }));
      },
      options
    );

    return () => {
      navigator.geolocation.clearWatch(geoWatchId);
    };
  }, [options]);

  return state;
}

export default useGeolocation;


import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';

interface GeolocationState {
  coords: GeolocationCoordinates | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  locationInitialized: boolean;
  getPosition: () => void;
  updateLocation: (lat: number, lng: number) => void;
}

export function useGeolocation(): GeolocationState {
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [locationInitialized, setLocationInitialized] = useState<boolean>(false);
  
  // Save manual location to localStorage
  const [manualLocation, setManualLocation] = useLocalStorage<{lat: number, lng: number} | null>(
    'manual-location-override',
    null
  );
  
  // Load manual location on init if exists
  useEffect(() => {
    if (manualLocation && !coords) {
      setCoords({
        latitude: manualLocation.lat,
        longitude: manualLocation.lng,
        accuracy: 0,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      } as GeolocationCoordinates);
      setLocationInitialized(true);
      setLoading(false);
    }
  }, [manualLocation]);
  
  const onSuccess = useCallback((position: GeolocationPosition) => {
    setCoords(position.coords);
    setError(null);
    setLoading(false);
    setLocationInitialized(true);
  }, []);
  
  const onError = useCallback((error: GeolocationPositionError) => {
    setError(error);
    setLoading(false);
    console.error("Geolocation error:", error.message);
  }, []);
  
  const getPosition = useCallback(() => {
    setLoading(true);
    
    // Clear manual location if any
    setManualLocation(null);
    
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by your browser',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError);
      setLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    });
  }, [onSuccess, onError, setManualLocation]);
  
  // Allow manual updating of location (e.g. from map click)
  const updateLocation = useCallback((lat: number, lng: number) => {
    setCoords({
      latitude: lat,
      longitude: lng,
      accuracy: 0,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    } as GeolocationCoordinates);
    setLocationInitialized(true);
    setLoading(false);
    setError(null);
    
    // Save to localStorage
    setManualLocation({ lat, lng });
  }, [setManualLocation]);
  
  useEffect(() => {
    getPosition();
  }, []);
  
  return {
    coords,
    error,
    loading,
    locationInitialized,
    getPosition,
    updateLocation
  };
}

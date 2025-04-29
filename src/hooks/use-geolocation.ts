
import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './use-local-storage';

// A custom hook that provides access to device geolocation
export function useGeolocation() {
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [cachedPosition, setCachedPosition] = useLocalStorage<{
    latitude: number;
    longitude: number;
    timestamp: number;
  } | null>('cached-geolocation', null);

  // Function to request geolocation
  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError(new GeolocationPositionError());
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords(position.coords);
        setLoading(false);
        
        // Cache the position
        setCachedPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now()
        });
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [setCachedPosition]);

  // Try to load cached position if available and recent
  useEffect(() => {
    const CACHE_VALIDITY = 30 * 60 * 1000; // 30 minutes
    
    if (cachedPosition && (Date.now() - cachedPosition.timestamp < CACHE_VALIDITY)) {
      // Use cached position as initial value
      setCoords({
        latitude: cachedPosition.latitude,
        longitude: cachedPosition.longitude,
        accuracy: 0,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      } as GeolocationCoordinates);
    } else {
      // Automatically get position on mount if no recent cache
      getPosition();
    }
  }, [cachedPosition, getPosition]);

  // Create derived state for easier consumption
  const locationInitialized = Boolean(coords);
  const latitude = coords?.latitude;
  const longitude = coords?.longitude;
  
  // Helper function to update location programmatically
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
    
    // Update cache
    setCachedPosition({
      latitude: lat,
      longitude: lng,
      timestamp: Date.now()
    });
  }, [setCachedPosition]);
  
  // Initialize location from cache or set defaults if unavailable
  const initializeLocation = useCallback(() => {
    if (coords) return; // Already initialized
    
    if (cachedPosition) {
      // Use cached position
      updateLocation(cachedPosition.latitude, cachedPosition.longitude);
    } else {
      // Set default location (e.g., center of China)
      updateLocation(35.8617, 104.1954);
    }
  }, [coords, cachedPosition, updateLocation]);

  return { 
    coords, 
    error, 
    loading, 
    getPosition,
    locationInitialized,
    latitude,
    longitude,
    updateLocation,
    initializeLocation
  };
}

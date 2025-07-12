import { useEffect, useState, useCallback } from 'react';

// Enhanced hook to handle user location with update capability
export function useUserGeolocation() {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => setPosition(null)
    );
    // Do not keep running: only initial grab
  }, []);

  const updatePosition = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng]);
  }, []);

  return { position, updatePosition };
}

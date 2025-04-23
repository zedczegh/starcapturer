import { useEffect, useState } from 'react';

// A tiny hook to safely grab user location, for community maps
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

  return position;
}

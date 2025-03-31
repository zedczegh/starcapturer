
import { useEffect, useRef } from 'react';

/**
 * Hook to help manage map component cleanup and prevent 
 * "Map container is already initialized" errors
 */
export function useMapReset() {
  const mapIdRef = useRef<string>(`map-${Math.random().toString(36).substring(2, 11)}`);
  const mapInitializedRef = useRef<boolean>(false);
  
  // Reset map ID when component mounts or remounts
  useEffect(() => {
    // Generate a new random ID on every mount
    mapIdRef.current = `map-${Math.random().toString(36).substring(2, 11)}`;
    mapInitializedRef.current = false;
    
    return () => {
      // Reset on unmount
      mapInitializedRef.current = false;
    };
  }, []);
  
  const setMapInitialized = (initialized: boolean) => {
    mapInitializedRef.current = initialized;
  };
  
  return {
    mapId: mapIdRef.current,
    isMapInitialized: mapInitializedRef.current,
    setMapInitialized
  };
}

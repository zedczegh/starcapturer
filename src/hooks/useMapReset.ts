
import { useEffect, useRef, useState } from 'react';

/**
 * Hook to help manage map component cleanup and prevent 
 * "Map container is already initialized" errors
 */
export function useMapReset() {
  // Generate a unique ID for this instance of the map
  const mapIdRef = useRef<string>(`map-${Math.random().toString(36).substring(2, 11)}`);
  const mapInstanceRef = useRef<any>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  
  // Reset map ID and initialization state when component mounts
  useEffect(() => {
    // Generate a new random ID on every mount
    mapIdRef.current = `map-${Math.random().toString(36).substring(2, 11)}`;
    setIsMapInitialized(false);
    
    return () => {
      // Clean up the map instance on unmount
      if (mapInstanceRef.current) {
        try {
          // Remove map event listeners
          mapInstanceRef.current.off();
          // Remove the map instance
          mapInstanceRef.current.remove();
        } catch (error) {
          console.error("Error cleaning up map instance:", error);
        }
      }
      mapInstanceRef.current = null;
      setIsMapInitialized(false);
    };
  }, []);
  
  const registerMapInstance = (mapInstance: any) => {
    if (mapInstance && !mapInstanceRef.current) {
      mapInstanceRef.current = mapInstance;
      setIsMapInitialized(true);
    }
  };
  
  return {
    mapId: mapIdRef.current,
    isMapInitialized,
    registerMapInstance,
    mapInstance: mapInstanceRef.current
  };
}

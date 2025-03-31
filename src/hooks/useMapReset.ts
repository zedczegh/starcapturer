
import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook to help manage map component cleanup and prevent 
 * "Map container is already initialized" errors
 */
export function useMapReset() {
  // Generate a unique ID for this instance of the map
  const mapIdRef = useRef<string>(`map-${Math.random().toString(36).substring(2, 11)}`);
  const mapInstanceRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const unmountingRef = useRef(false);
  
  // Function to safely clean up map instance
  const cleanupMap = useCallback(() => {
    if (mapInstanceRef.current) {
      try {
        // Remove event listeners
        mapInstanceRef.current.off();
        // Remove the map instance
        mapInstanceRef.current.remove();
      } catch (error) {
        console.error("Error cleaning up map instance:", error);
      } finally {
        mapInstanceRef.current = null;
        setIsMapInitialized(false);
      }
    }
  }, []);
  
  // Reset map state when component mounts and clean up when it unmounts
  useEffect(() => {
    // Set flags for mount state
    unmountingRef.current = false;
    
    // Generate a new random ID on every mount
    mapIdRef.current = `map-${Math.random().toString(36).substring(2, 11)}`;
    setIsMapInitialized(false);
    
    return () => {
      // Mark as unmounting to prevent late state updates
      unmountingRef.current = true;
      
      // Clean up the map instance on unmount
      cleanupMap();
    };
  }, [cleanupMap]);
  
  // Register the map instance
  const registerMapInstance = useCallback((mapInstance: any) => {
    if (mapInstance && !mapInstanceRef.current && !unmountingRef.current) {
      mapInstanceRef.current = mapInstance;
      setIsMapInitialized(true);
    }
  }, []);
  
  // Register the map container ref
  const registerContainerRef = useCallback((element: HTMLDivElement | null) => {
    mapContainerRef.current = element;
  }, []);
  
  return {
    mapId: mapIdRef.current,
    isMapInitialized,
    registerMapInstance,
    registerContainerRef,
    mapInstance: mapInstanceRef.current,
    containerRef: mapContainerRef,
    cleanupMap
  };
}

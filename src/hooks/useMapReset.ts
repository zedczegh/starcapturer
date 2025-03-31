
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * A hook to handle map resets and prevent the "Map container is already initialized" error
 * Returns a unique mapId for each component instance and handles map initialization state
 */
export function useMapReset() {
  // Create a unique ID for this map instance
  const [mapId] = useState(() => `map-${Math.random().toString(36).substring(2, 11)}`);
  const [isMapInitialized, setMapInitialized] = useState(false);
  
  // Get current route to detect navigation
  const location = useLocation();
  
  // Reset map initialization state on route change
  useEffect(() => {
    setMapInitialized(false);
    
    // Return cleanup function
    return () => {
      setMapInitialized(false);
    };
  }, [location.pathname]);
  
  return {
    mapId,
    isMapInitialized,
    setMapInitialized
  };
}

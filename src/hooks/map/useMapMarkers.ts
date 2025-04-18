
import { useCallback } from 'react';

/**
 * Simplified hook for managing map marker interactions - click only
 */
export const useMapMarkers = () => {
  const handleLocationClick = useCallback((id: string | null) => {
    // No-op - handled by marker click handlers directly
  }, []);

  return {
    hoveredLocationId: null,
    handleHover: handleLocationClick,
    handleTouchStart: () => {},
    handleTouchEnd: () => {},
    handleTouchMove: () => {}
  };
};

export default useMapMarkers;

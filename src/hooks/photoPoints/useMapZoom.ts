
import { useCallback } from 'react';

/**
 * Hook to manage map zoom levels based on search radius
 */
export const useMapZoom = () => {
  /**
   * Get appropriate zoom level based on search radius
   */
  const getZoomLevel = useCallback((radius: number) => {
    if (radius <= 50) return 10;
    if (radius <= 100) return 9;
    if (radius <= 200) return 8;
    if (radius <= 500) return 7;
    if (radius <= 1000) return 6;
    if (radius <= 5000) return 4;
    return 3;
  }, []);

  return { getZoomLevel };
};

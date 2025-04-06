
import { useCallback, useState, useRef } from 'react';

/**
 * Custom hook for managing map marker hover states
 * Provides hover management with debouncing to prevent flicker
 */
export const useMapMarkers = () => {
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  /**
   * Handle hover state with debouncing to prevent flicker
   * @param id - Location ID to hover, or null to clear hover state
   */
  const handleHover = useCallback((id: string | null) => {
    // Clear any existing timeout to prevent flickering
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Set a small timeout to debounce rapid hover changes
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredLocationId(id);
      hoverTimeoutRef.current = null;
    }, 100); // Increase debounce delay to reduce flicker
  }, []);

  // Clean up timeout on component unmount
  const cleanup = useCallback(() => {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  return {
    hoveredLocationId,
    setHoveredLocationId,
    handleHover,
    cleanup
  };
};


import { useCallback, useState, useRef, useEffect } from 'react';

/**
 * Custom hook for managing map marker hover states with improved debounce
 */
export const useMapMarkers = () => {
  // State for currently hovered location ID
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  
  // Refs to manage timing and prevent flicker
  const hoverTimeoutRef = useRef<number | null>(null);
  const lastHoverId = useRef<string | null>(null);
  const hoverTimestamp = useRef<number>(0);
  const isHoverLocked = useRef<boolean>(false);
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handle hover with improved debounce algorithm to prevent flicker
   */
  const handleHover = useCallback((id: string | null) => {
    // Prevent redundant updates for same ID
    if (id === lastHoverId.current) return;
    
    // Clear any pending timeouts
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Track current time
    const now = Date.now();
    
    // Fast hover when nothing is currently selected
    if (id !== null && hoveredLocationId === null) {
      setHoveredLocationId(id);
      lastHoverId.current = id;
      hoverTimestamp.current = now;
      isHoverLocked.current = true;
      return;
    }
    
    // When leaving a marker completely
    if (id === null) {
      // Add a delay to prevent rapid hover state changes
      const delay = now - hoverTimestamp.current < 200 ? 100 : 50;
      
      hoverTimeoutRef.current = window.setTimeout(() => {
        setHoveredLocationId(null);
        lastHoverId.current = null;
        isHoverLocked.current = false;
        hoverTimeoutRef.current = null;
      }, delay);
      return;
    }
    
    // When switching between markers - make it faster
    setHoveredLocationId(id);
    lastHoverId.current = id;
    hoverTimestamp.current = now;
    isHoverLocked.current = true;
  }, [hoveredLocationId]);
  
  return {
    hoveredLocationId,
    handleHover
  };
};

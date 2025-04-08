
import { useCallback, useState, useRef, useEffect } from 'react';

/**
 * Custom hook for managing map marker hover states with enhanced anti-flicker algorithm
 */
export const useMapMarkers = () => {
  // State for currently hovered location ID
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  
  // Refs for improved hover stability
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHoverId = useRef<string | null>(null);
  const hoverTimestamp = useRef<number>(0);
  const isHoverLocked = useRef<boolean>(false);
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current !== null) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (debounceTimeoutRef.current !== null) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handle hover with improved anti-flicker debounce algorithm
   */
  const handleHover = useCallback((id: string | null) => {
    // Prevent redundant updates for same ID
    if (id === lastHoverId.current) return;
    
    // Clear any pending timeouts
    if (hoverTimeoutRef.current !== null) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    if (debounceTimeoutRef.current !== null) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    // Track current time
    const now = Date.now();
    
    // For new hover target, set with slight delay for better stability
    if (id !== null) {
      // If rapidly changing between markers, use longer delay
      const delay = now - hoverTimestamp.current < 300 ? 80 : 50;
      
      debounceTimeoutRef.current = setTimeout(() => {
        setHoveredLocationId(id);
        lastHoverId.current = id;
        hoverTimestamp.current = Date.now();
        isHoverLocked.current = true;
        debounceTimeoutRef.current = null;
      }, delay);
    } 
    // When leaving a marker completely
    else {
      // Add a delay to prevent flicker on quick mouse movements
      const delay = now - hoverTimestamp.current < 200 ? 150 : 100;
      
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredLocationId(null);
        lastHoverId.current = null;
        isHoverLocked.current = false;
        hoverTimeoutRef.current = null;
      }, delay);
    }
  }, []);
  
  return {
    hoveredLocationId,
    handleHover,
    isHoverLocked: isHoverLocked.current
  };
};

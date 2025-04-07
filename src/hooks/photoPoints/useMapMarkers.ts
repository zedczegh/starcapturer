
import { useCallback, useState, useRef, useEffect } from 'react';

/**
 * Custom hook for managing map marker hover states
 * Provides hover management with improved debouncing to prevent flicker
 */
export const useMapMarkers = () => {
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const lastHoverIdRef = useRef<string | null>(null);
  const hoverStartTimeRef = useRef<number>(0);
  const isLockHoverRef = useRef<boolean>(false);
  
  // Clear hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    };
  }, []);

  /**
   * Handle hover state with improved debouncing to prevent flicker
   * @param id - Location ID to hover, or null to clear hover state
   */
  const handleHover = useCallback((id: string | null) => {
    // If locked, only allow the locked ID or explicitly setting to null
    if (isLockHoverRef.current && id !== null && id !== lastHoverIdRef.current) {
      return;
    }
    
    // If hovering same item, don't re-trigger
    if (id === lastHoverIdRef.current) return;
    
    // Clear any existing timeout to prevent flickering
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Store current time for hover start
    const now = Date.now();
    
    // Fast response for initial hover (mouseenter)
    if (id !== null && hoveredLocationId === null) {
      // Immediate hover when nothing is currently hovered
      setHoveredLocationId(id);
      lastHoverIdRef.current = id;
      hoverStartTimeRef.current = now;
      return;
    }
    
    // If leaving an item entirely, add small delay
    if (id === null) {
      // Don't release hover lock too quickly if recently established
      const hoverDuration = now - hoverStartTimeRef.current;
      
      // Only unlock hover if explicitly requested by setting null
      if (isLockHoverRef.current) {
        isLockHoverRef.current = false;
      }
      
      // If hovered for less than 300ms, use a shorter delay to prevent feeling sluggish
      const timeoutDelay = hoverDuration < 300 ? 50 : 150;
      
      hoverTimeoutRef.current = window.setTimeout(() => {
        setHoveredLocationId(null);
        lastHoverIdRef.current = null;
        hoverTimeoutRef.current = null;
      }, timeoutDelay);
      return;
    }
    
    // For switching between items, make it quick but with minimal delay
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredLocationId(id);
      lastHoverIdRef.current = id;
      hoverStartTimeRef.current = now;
      hoverTimeoutRef.current = null;
      
      // If hovered for more than brief moment, lock the hover
      isLockHoverRef.current = true;
    }, 50);
  }, [hoveredLocationId]);

  // Allow explicit setting of hover without the debounce logic
  const setHoveredLocationIdDirectly = useCallback((id: string | null) => {
    // Clear any pending timeouts
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Update state directly
    setHoveredLocationId(id);
    lastHoverIdRef.current = id;
    
    // Set or clear hover lock
    if (id === null) {
      isLockHoverRef.current = false;
    } else {
      isLockHoverRef.current = true;
      hoverStartTimeRef.current = Date.now();
    }
  }, []);

  return {
    hoveredLocationId,
    setHoveredLocationId: setHoveredLocationIdDirectly, // Replace with direct version
    handleHover
  };
};


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
  const mousePositionRef = useRef<{x: number, y: number}>({ x: 0, y: 0 });
  
  // Clear hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    };
  }, []);

  // Track mouse position to detect if user has moved away significantly
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
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
      
      // Use a very short delay to prevent flickering but still be responsive
      const timeoutDelay = hoverDuration < 300 ? 30 : 80;
      
      hoverTimeoutRef.current = window.setTimeout(() => {
        setHoveredLocationId(null);
        lastHoverIdRef.current = null;
        hoverTimeoutRef.current = null;
      }, timeoutDelay);
      return;
    }
    
    // For switching between items, make it immediate to prevent flickering
    setHoveredLocationId(id);
    lastHoverIdRef.current = id;
    hoverStartTimeRef.current = now;
    
    // If user stays on a marker for a brief moment, lock the hover
    const lockTimeoutDelay = 300; // ms to wait before locking hover
    
    hoverTimeoutRef.current = window.setTimeout(() => {
      isLockHoverRef.current = true;
      hoverTimeoutRef.current = null;
    }, lockTimeoutDelay);
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

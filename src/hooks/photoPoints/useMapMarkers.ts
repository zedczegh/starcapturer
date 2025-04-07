
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
  const hoverDelayTimeoutRef = useRef<number | null>(null);
  const initialHoverTimeRef = useRef<number>(0);
  
  // Clear hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      
      if (hoverDelayTimeoutRef.current !== null) {
        window.clearTimeout(hoverDelayTimeoutRef.current);
        hoverDelayTimeoutRef.current = null;
      }
    };
  }, []);

  /**
   * Handle hover state with improved debouncing to prevent flicker
   * @param id - Location ID to hover, or null to clear hover state
   */
  const handleHover = useCallback((id: string | null) => {
    // Cancel any pending delay timeouts
    if (hoverDelayTimeoutRef.current !== null) {
      window.clearTimeout(hoverDelayTimeoutRef.current);
      hoverDelayTimeoutRef.current = null;
    }
    
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
      initialHoverTimeRef.current = now;
      
      // Small delay before showing tooltip to prevent flickering on quick mouse movements
      hoverDelayTimeoutRef.current = window.setTimeout(() => {
        // Only proceed if this is still the current hover target
        if (id === lastHoverIdRef.current || lastHoverIdRef.current === null) {
          // Immediate hover when nothing is currently hovered
          setHoveredLocationId(id);
          lastHoverIdRef.current = id;
          hoverStartTimeRef.current = now;
          
          // Lock hover after a brief moment to prevent accidental mouse movements from changing hover
          setTimeout(() => {
            if (lastHoverIdRef.current === id) {
              isLockHoverRef.current = true;
            }
          }, 120);
        }
        
        hoverDelayTimeoutRef.current = null;
      }, 50); // Small delay to prevent flicker
      
      // Always update last hover ID immediately
      lastHoverIdRef.current = id;
      return;
    }
    
    // If leaving an item entirely, add small delay
    if (id === null) {
      // Only unlock hover if explicitly requested by setting null
      if (isLockHoverRef.current) {
        isLockHoverRef.current = false;
      }
      
      // Check if we've been hovering for less than 200ms - if so, don't show hover at all
      const hoverDuration = now - initialHoverTimeRef.current;
      if (hoverDuration < 200) {
        // For very brief hovers, clear immediately to prevent flicker
        setHoveredLocationId(null);
        lastHoverIdRef.current = null;
        return;
      }
      
      // Longer delay before clearing hover completely (300ms feels smooth)
      hoverTimeoutRef.current = window.setTimeout(() => {
        setHoveredLocationId(null);
        lastHoverIdRef.current = null;
        hoverTimeoutRef.current = null;
      }, 350); // Increased from 300ms to 350ms for smoother experience
      return;
    }
    
    // For switching between items, make it quick but with minimal delay
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredLocationId(id);
      lastHoverIdRef.current = id;
      hoverStartTimeRef.current = now;
      hoverTimeoutRef.current = null;
      
      // Lock hover after hover stabilizes
      isLockHoverRef.current = true;
    }, 50); // Kept at 50ms for quick response
  }, [hoveredLocationId]);

  // Allow explicit setting of hover without the debounce logic
  const setHoveredLocationIdDirectly = useCallback((id: string | null) => {
    // Clear any pending timeouts
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    if (hoverDelayTimeoutRef.current !== null) {
      window.clearTimeout(hoverDelayTimeoutRef.current);
      hoverDelayTimeoutRef.current = null;
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

  // Function to clear hover on map events (click or drag)
  const clearHoverOnMapInteraction = useCallback(() => {
    setHoveredLocationId(null);
    lastHoverIdRef.current = null;
    isLockHoverRef.current = false;
    
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    if (hoverDelayTimeoutRef.current !== null) {
      window.clearTimeout(hoverDelayTimeoutRef.current);
      hoverDelayTimeoutRef.current = null;
    }
  }, []);

  return {
    hoveredLocationId,
    setHoveredLocationId: setHoveredLocationIdDirectly, 
    handleHover,
    clearHoverOnMapInteraction,
    isHoverLocked: isLockHoverRef.current
  };
};

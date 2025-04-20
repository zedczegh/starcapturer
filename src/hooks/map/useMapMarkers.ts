
import { useCallback, useState, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMapTouchInteractions } from './useMapTouchInteractions';

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
  const touchStartPos = useRef<{x: number, y: number} | null>(null);
  
  // Check if on mobile device
  const isMobile = useIsMobile();
  
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
   * Handle hover with improved anti-flicker algorithm
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
      const delay = isMobile ? 
        100 : // Mobile delay
        (now - hoverTimestamp.current < 300 ? 40 : 20); // Desktop delay
      
      debounceTimeoutRef.current = setTimeout(() => {
        setHoveredLocationId(id);
        lastHoverId.current = id;
        hoverTimestamp.current = Date.now();
        debounceTimeoutRef.current = null;
      }, delay);
    } 
    // When leaving a marker completely
    else {
      // Add a delay to prevent flicker on quick mouse movements
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredLocationId(null);
        lastHoverId.current = null;
        hoverTimeoutRef.current = null;
      }, isMobile ? 250 : 50); // Longer delay for mobile
    }
  }, [isMobile]);

  // Get touch interaction handlers
  const { handleTouchStart: baseHandleTouchStart, handleTouchEnd, handleTouchMove: baseHandleTouchMove } = useMapTouchInteractions(handleHover);
  
  // Wrap touch start to capture position
  const handleTouchStart = useCallback((e: React.TouchEvent, id: string) => {
    if (e.touches && e.touches[0]) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
    
    baseHandleTouchStart(e, id);
  }, [baseHandleTouchStart]);
  
  // Wrap touch move to use captured position
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchStartPos.current = baseHandleTouchMove(e, touchStartPos.current);
  }, [baseHandleTouchMove]);
  
  return {
    hoveredLocationId,
    handleHover,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove
  };
};

export default useMapMarkers;

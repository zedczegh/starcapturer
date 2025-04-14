
import { useCallback, useState, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Custom hook for managing map marker hover states with click-based popup behavior instead of hover
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
  const touchMoveCount = useRef<number>(0);
  const lastTapTime = useRef<number>(0);
  
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
   * Only affects visual appearance, doesn't auto-open popups
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
    
    // For new hover target, set immediately for visual feedback only
    if (id !== null) {
      setHoveredLocationId(id);
      lastHoverId.current = id;
      hoverTimestamp.current = Date.now();
    } 
    // When leaving a marker completely
    else {
      // Small delay to prevent flicker on quick mouse movements
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredLocationId(null);
        lastHoverId.current = null;
        hoverTimeoutRef.current = null;
      }, 30); // Very short delay, just for visual smoothness
    }
  }, []);
  
  /**
   * Handle touch start event for better touch interaction
   */
  const handleTouchStart = useCallback((e: React.TouchEvent, id: string) => {
    if (!isMobile) return;
    
    // Reset touch movement counter
    touchMoveCount.current = 0;
    
    // Store touch position to determine if it's a tap or drag later
    if (e.touches && e.touches[0]) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
    
    // Detect double tap
    const now = Date.now();
    const isDoubleTap = (now - lastTapTime.current < 300);
    lastTapTime.current = now;
    
    // Prevent default to avoid double-firing issues on some mobile browsers
    e.stopPropagation();
    
    // Set hover state for visual feedback only
    handleHover(id);
  }, [isMobile, handleHover]);
  
  /**
   * Handle touch end event for better touch interaction
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent, id: string | null) => {
    if (!isMobile) return;
    
    // Prevent default behaviors
    e.stopPropagation();
    
    // Only consider it a tap if minimal movement occurred
    // Visual state is managed by the marker component's click handler now
    
    touchStartPos.current = null;
  }, [isMobile]);
  
  /**
   * Handle touch move to detect dragging vs tapping
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !touchStartPos.current) return;
    
    // Increment movement counter
    touchMoveCount.current++;
    
    if (e.touches && e.touches[0]) {
      const moveX = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
      const moveY = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
      
      // If moved more than threshold, consider it a drag
      if (moveX > 10 || moveY > 10) {
        // If significant movement, clear hover immediately
        if (moveX > 30 || moveY > 30) {
          handleHover(null);
          touchStartPos.current = null;
        }
      }
    }
  }, [isMobile, handleHover]);
  
  return {
    hoveredLocationId,
    handleHover,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove
  };
};

export default useMapMarkers;

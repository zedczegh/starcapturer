import { useState, useCallback, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Enhanced hook for managing map marker interactions with mobile optimization
 */
export const useMapMarkers = () => {
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Refs for better performance and state management
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHoverId = useRef<string | null>(null);
  const touchStartTime = useRef<number>(0);
  const touchStartPos = useRef<{x: number, y: number} | null>(null);
  const isScrolling = useRef<boolean>(false);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Optimized hover handler with mobile considerations
  const handleHover = useCallback((id: string | null) => {
    // Prevent unnecessary updates
    if (id === lastHoverId.current) return;
    
    // Clear existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    if (id !== null) {
      // Immediate hover for desktop, slight delay for mobile
      const delay = isMobile ? 50 : 0;
      
      if (delay > 0) {
        hoverTimeoutRef.current = setTimeout(() => {
          setHoveredLocationId(id);
          lastHoverId.current = id;
        }, delay);
      } else {
        setHoveredLocationId(id);
        lastHoverId.current = id;
      }
    } else {
      // Clear hover with appropriate delay
      const clearDelay = isMobile ? 100 : 25;
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredLocationId(null);
        lastHoverId.current = null;
      }, clearDelay);
    }
  }, [isMobile]);

  // Enhanced touch start handler
  const handleTouchStart = useCallback((e: React.TouchEvent, id: string) => {
    if (!isMobile) return;
    
    touchStartTime.current = Date.now();
    isScrolling.current = false;
    
    if (e.touches && e.touches[0]) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
    
    // Set hover state immediately for better responsiveness
    handleHover(id);
  }, [isMobile, handleHover]);

  // Enhanced touch end handler
  const handleTouchEnd = useCallback((e: React.TouchEvent, id: string | null) => {
    if (!isMobile) return;
    
    const touchDuration = Date.now() - touchStartTime.current;
    
    // If it was a quick tap and not scrolling
    if (touchDuration < 500 && !isScrolling.current) {
      // Keep hover state longer for mobile users to interact
      setTimeout(() => {
        handleHover(null);
      }, 3000); // 3 seconds for mobile interaction
    } else {
      // Clear immediately if it was a long press or scroll
      handleHover(null);
    }
    
    // Reset tracking
    touchStartPos.current = null;
    touchStartTime.current = 0;
    isScrolling.current = false;
  }, [isMobile, handleHover]);

  // Enhanced touch move handler
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !touchStartPos.current) return;
    
    if (e.touches && e.touches[0]) {
      const moveX = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
      const moveY = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
      
      // Detect scrolling with generous threshold
      if (moveX > 15 || moveY > 15) {
        isScrolling.current = true;
        handleHover(null);
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

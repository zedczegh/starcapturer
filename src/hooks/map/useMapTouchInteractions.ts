import { useCallback, useRef } from 'react';

type HoverHandler = (id: string | null) => void;

export const useMapTouchInteractions = (onHover: HoverHandler) => {
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchMoveCount = useRef(0);
  
  const handleTouchStart = useCallback((e: React.TouchEvent, id: string) => {
    // Clear existing timer if any
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
    }
    
    // Reset move counter
    touchMoveCount.current = 0;
    
    // Set hover after a small delay to prevent flickering during scrolling
    touchTimer.current = setTimeout(() => {
      onHover(id);
      touchTimer.current = null;
    }, 100);
  }, [onHover]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent, id: string | null) => {
    // If user has moved a lot, don't trigger hover
    if (touchMoveCount.current > 5) {
      if (touchTimer.current) {
        clearTimeout(touchTimer.current);
        touchTimer.current = null;
      }
      onHover(null);
      return;
    }
    
    // Keep hover state for a bit, then clear it
    if (id !== null) {
      setTimeout(() => {
        onHover(null);
      }, 2000);
    } else {
      onHover(null);
    }
  }, [onHover]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent, startPos: {x: number, y: number} | null) => {
    touchMoveCount.current += 1;
    
    // If moved more than a threshold, cancel hover
    if (touchMoveCount.current > 3 && touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
      onHover(null);
    }
    
    // Calculate and return new position
    if (e.touches && e.touches[0] && startPos) {
      const xDiff = Math.abs(e.touches[0].clientX - startPos.x);
      const yDiff = Math.abs(e.touches[0].clientY - startPos.y);
      
      // If moved significantly, update position
      if (xDiff > 10 || yDiff > 10) {
        return {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      }
    }
    
    return startPos;
  }, [onHover]);
  
  return {
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove
  };
};

export default useMapTouchInteractions;

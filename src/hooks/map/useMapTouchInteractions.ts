
import { useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TouchPosition {
  x: number;
  y: number;
}

export const useMapTouchInteractions = (handleHover: (id: string | null) => void) => {
  const isMobile = useIsMobile();
  
  /**
   * Handle touch start event for better touch interaction
   */
  const handleTouchStart = useCallback((e: React.TouchEvent<Element>, id: string) => {
    if (!isMobile) return;
    
    // Prevent default to avoid double-firing issues on some mobile browsers
    e.stopPropagation();
    
    // Immediately show hover state on touch start
    handleHover(id);
  }, [isMobile, handleHover]);
  
  /**
   * Handle touch end event for better touch interaction
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent<Element>) => {
    if (!isMobile) return;
    
    // Prevent default behaviors
    e.stopPropagation();
    
    // Keep hover state visible significantly longer on mobile
    setTimeout(() => {
      handleHover(null);
    }, 5000); // 5 seconds for better interaction time
  }, [isMobile, handleHover]);
  
  /**
   * Handle touch move to detect dragging vs tapping
   * Returns updated position if needed
   */
  const handleTouchMove = useCallback((e: React.TouchEvent<Element>, touchStartPos: TouchPosition | null): TouchPosition | null => {
    if (!isMobile || !touchStartPos) return touchStartPos;
    
    if (e.touches && e.touches[0]) {
      const moveX = Math.abs(e.touches[0].clientX - touchStartPos.x);
      const moveY = Math.abs(e.touches[0].clientY - touchStartPos.y);
      
      // If moved more than threshold, consider it a drag and clear hover
      if (moveX > 20 || moveY > 20) {
        handleHover(null);
        return null;
      }
    }
    
    return touchStartPos;
  }, [isMobile, handleHover]);
  
  return {
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove
  };
};

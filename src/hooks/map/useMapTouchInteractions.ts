import { useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

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
   */
  const handleTouchMove = useCallback((e: React.TouchEvent<Element>) => {
    if (!isMobile) return;
    
    if (e.touches && e.touches[0]) {
      // Here we'd need to compare with touchStartPos, but we're keeping it simpler
      // by just returning, since parent components manage the touchStartPos state
      return;
    }
  }, [isMobile]);
  
  return {
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove
  };
};

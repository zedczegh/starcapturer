import { useCallback, useState, useRef, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Custom hook for managing map marker hover states with enhanced anti-flicker algorithm
 * and mobile touch optimizations
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
   * Mobile-optimized to handle both hover and touch events
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
      // Mobile needs slightly longer delay to prevent accidental triggers
      const delay = isMobile ? 
        50 : // Mobile delay - reduced for better responsiveness
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
      // Use longer delay on mobile to improve experience
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredLocationId(null);
        lastHoverId.current = null;
        hoverTimeoutRef.current = null;
      }, isMobile ? 150 : 50); // Reduced from 250ms for better responsiveness
    }
  }, [isMobile]);
  
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
    
    // Immediately show hover state on touch start
    handleHover(id);
    
    // For double tap, zoom in to marker
    if (isDoubleTap) {
      // Find the map instance
      const leafletMap = (window as any).leafletMap;
      if (leafletMap) {
        // Get current zoom and increase it
        const currentZoom = leafletMap.getZoom();
        const newZoom = Math.min(currentZoom + 1, 18);
        
        // Find marker position and zoom to it
        const locations = document.querySelectorAll(`.leaflet-marker-icon[data-id="${id}"]`);
        if (locations.length > 0) {
          const rect = locations[0].getBoundingClientRect();
          const point = {
            x: rect.left + rect.width/2,
            y: rect.top + rect.height/2
          };
          const latlng = leafletMap.containerPointToLatLng([point.x, point.y]);
          
          // Zoom to marker position
          leafletMap.setView(latlng, newZoom, {
            animate: true
          });
        }
      }
    }
  }, [isMobile, handleHover]);
  
  /**
   * Handle touch end event for better touch interaction
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent, id: string | null) => {
    if (!isMobile) return;
    
    // Prevent default behaviors
    e.stopPropagation();
    
    // Only consider it a tap if minimal movement occurred
    if (touchMoveCount.current < 5) {
      // Keep hover state visible significantly longer on mobile
      // This gives users enough time to read and interact with the popup
      setTimeout(() => {
        // Only clear if this is still the active hover
        if (lastHoverId.current === id) {
          handleHover(null);
        }
      }, 5000); // Keep popup open for 5 seconds
    } else {
      // If significant movement occurred, clear immediately
      handleHover(null);
    }
    
    touchStartPos.current = null;
  }, [isMobile, handleHover]);
  
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
      
      // If moved more than threshold, consider it a drag and clear hover
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

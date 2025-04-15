
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface UseMapInteractionsProps {
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMarkerHover?: (id: string | null) => void;
}

export const useMapInteractions = ({
  onLocationClick,
  onMarkerHover
}: UseMapInteractionsProps) => {
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const [hideMarkerPopups, setHideMarkerPopups] = useState(false);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastHoverId, setLastHoverId] = useState<string | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  
  // Use a ref for recursion prevention instead of state to avoid re-renders
  const preventRecursionRef = useRef(false);
  
  // Handle marker hover with recursion prevention and touch optimization
  const handleMarkerHover = useCallback((id: string | null) => {
    // Prevent recursion using ref
    if (preventRecursionRef.current) return;
    
    // Set flag to prevent recursive calls
    preventRecursionRef.current = true;
    
    try {
      if (id !== lastHoverId) {
        setLastHoverId(id);
        
        // Add delay for clearing hover state
        if (id === null) {
          setTimeout(() => {
            setHoveredLocationId(null);
          }, 50);
        } else {
          setHoveredLocationId(id);
        }
      }
      
      if (onMarkerHover && id !== hoveredLocationId) {
        onMarkerHover(id);
      }
    } finally {
      // Clear the recursion flag after a short delay
      setTimeout(() => {
        preventRecursionRef.current = false;
      }, 0);
    }
  }, [onMarkerHover, lastHoverId, hoveredLocationId]);
  
  // Handle location click with touch optimization
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    const now = Date.now();
    const touchDuration = now - touchStartTime;
    
    // Prevent double clicks and long presses
    if (now - lastClickTime < 300 || touchDuration > 500) {
      return;
    }
    
    setLastClickTime(now);
    
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick, lastClickTime, touchStartTime]);

  // Handle touch start
  const handleTouchStart = useCallback(() => {
    setTouchStartTime(Date.now());
  }, []);

  // Handle map drag
  const handleMapDragStart = useCallback(() => {
    setHideMarkerPopups(true);
    
    if (!preventRecursionRef.current) {
      preventRecursionRef.current = true;
      
      if (hoveredLocationId !== null) {
        setHoveredLocationId(null);
      }
      
      if (onMarkerHover) {
        onMarkerHover(null);
      }
      
      setTimeout(() => {
        preventRecursionRef.current = false;
      }, 50);
    }
  }, [hoveredLocationId, onMarkerHover]);
  
  const handleMapDragEnd = useCallback(() => {
    setTimeout(() => {
      setHideMarkerPopups(false);
    }, 100);
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (onMarkerHover && !preventRecursionRef.current) {
        onMarkerHover(null);
      }
    };
  }, [onMarkerHover]);

  return {
    hoveredLocationId,
    hideMarkerPopups,
    handleMarkerHover,
    handleLocationClick,
    handleMapDragStart,
    handleMapDragEnd,
    handleTouchStart
  };
};

export default useMapInteractions;

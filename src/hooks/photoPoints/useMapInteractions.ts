
import { useState, useCallback, useEffect } from 'react';
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
  const [preventRecursion, setPreventRecursion] = useState(false);
  
  // Handle marker hover with recursion prevention
  const handleMarkerHover = useCallback((id: string | null) => {
    // Prevent recursion - if we're already processing a hover, don't trigger another
    if (preventRecursion) {
      return;
    }
    
    // Set recursion lock
    setPreventRecursion(true);
    
    try {
      // Simple hover debounce to prevent flickering
      if (id !== lastHoverId) {
        setLastHoverId(id);
        if (id === null) {
          // Add delay when clearing hover state
          setTimeout(() => {
            setHoveredLocationId(null);
          }, 50);
        } else {
          setHoveredLocationId(id);
        }
      }
      
      // Only call external handler if provided AND not the same ID
      // This prevents the infinite loop
      if (onMarkerHover && id !== hoveredLocationId) {
        onMarkerHover(id);
      }
    } finally {
      // Clear recursion lock with slight delay
      setTimeout(() => {
        setPreventRecursion(false);
      }, 0);
    }
  }, [onMarkerHover, lastHoverId, hoveredLocationId, preventRecursion]);
  
  // Handle location click
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    // Simple debounce for clicks
    const now = Date.now();
    if (now - lastClickTime < 300) {
      return;
    }
    setLastClickTime(now);
    
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick, lastClickTime]);

  // Handle map interaction to hide popups while interacting
  const handleMapDragStart = useCallback(() => {
    setHideMarkerPopups(true);
    
    // Prevent recursive calls on drag
    if (!preventRecursion) {
      setPreventRecursion(true);
      
      if (hoveredLocationId !== null) {
        setHoveredLocationId(null);
      }
      
      if (onMarkerHover) {
        onMarkerHover(null);
      }
      
      setTimeout(() => {
        setPreventRecursion(false);
      }, 50);
    }
  }, [hoveredLocationId, onMarkerHover, preventRecursion]);
  
  const handleMapDragEnd = useCallback(() => {
    // Small delay to prevent immediate popup reappearance
    setTimeout(() => {
      setHideMarkerPopups(false);
    }, 100);
  }, []);
  
  // Clear hover when component unmounts or on certain conditions
  useEffect(() => {
    return () => {
      if (onMarkerHover && !preventRecursion) {
        onMarkerHover(null);
      }
    };
  }, [onMarkerHover, preventRecursion]);

  return {
    hoveredLocationId,
    hideMarkerPopups,
    handleMarkerHover,
    handleLocationClick,
    handleMapDragStart,
    handleMapDragEnd
  };
};

export default useMapInteractions;

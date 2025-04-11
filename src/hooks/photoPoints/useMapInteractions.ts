
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
  
  // Handle marker hover with improved event throttling
  const handleMarkerHover = useCallback((id: string | null) => {
    if (hoveredLocationId !== id) {
      setHoveredLocationId(id);
      if (onMarkerHover) {
        onMarkerHover(id);
      }
    }
  }, [onMarkerHover, hoveredLocationId]);
  
  // Handle location click with enhanced debouncing
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    // Improved debounce for clicks
    const now = Date.now();
    if (now - lastClickTime < 300) {
      return;
    }
    setLastClickTime(now);
    
    if (onLocationClick) {
      // Process the click after a short delay to prevent double-click issues
      setTimeout(() => {
        onLocationClick(location);
      }, 10);
    }
  }, [onLocationClick, lastClickTime]);

  // Handle map interaction to hide popups while interacting
  const handleMapDragStart = useCallback(() => {
    setHideMarkerPopups(true);
    handleMarkerHover(null);
  }, [handleMarkerHover]);
  
  const handleMapDragEnd = useCallback(() => {
    // Optimized delay to prevent immediate popup reappearance
    requestAnimationFrame(() => {
      setTimeout(() => {
        setHideMarkerPopups(false);
      }, 100);
    });
  }, []);
  
  // Clear hover when component unmounts or on certain conditions
  useEffect(() => {
    return () => {
      if (onMarkerHover) {
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
    handleMapDragEnd
  };
};

export default useMapInteractions;


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
  const lastClickTimeRef = useRef<number>(0);
  const clickDebounceTimeRef = useRef<number>(300); // Debounce time in ms
  
  // Handle marker hover
  const handleMarkerHover = useCallback((id: string | null) => {
    setHoveredLocationId(id);
    if (onMarkerHover) {
      onMarkerHover(id);
    }
  }, [onMarkerHover]);
  
  // Handle location click
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    // Simple debounce for clicks
    const now = Date.now();
    if (now - lastClickTimeRef.current < clickDebounceTimeRef.current) {
      return;
    }
    lastClickTimeRef.current = now;
    
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick]);

  // Handle map interaction to hide popups while interacting
  const handleMapDragStart = useCallback(() => {
    setHideMarkerPopups(true);
    handleMarkerHover(null);
  }, [handleMarkerHover]);
  
  const handleMapDragEnd = useCallback(() => {
    // Small delay to prevent immediate popup reappearance
    setTimeout(() => {
      setHideMarkerPopups(false);
    }, 100);
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

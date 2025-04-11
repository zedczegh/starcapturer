
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useMapMarkers } from './useMapMarkers';

interface UseMapInteractionsProps {
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMarkerHover?: (id: string | null) => void;
}

export const useMapInteractions = ({
  onLocationClick,
  onMarkerHover
}: UseMapInteractionsProps) => {
  const [hideMarkerPopups, setHideMarkerPopups] = useState(false);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Use our enhanced map markers hook
  const {
    hoveredLocationId,
    handleHover: handleMarkerHover,
    handleZoomStart,
    handleZoomEnd
  } = useMapMarkers();
  
  // Clean up any timers on unmount
  useEffect(() => {
    return () => {
      if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
      if (dragTimerRef.current) clearTimeout(dragTimerRef.current);
    };
  }, []);
  
  // Handle marker hover with improved event throttling
  const handleHover = useCallback((id: string | null) => {
    handleMarkerHover(id);
    if (onMarkerHover) {
      onMarkerHover(id);
    }
  }, [onMarkerHover, handleMarkerHover]);
  
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
    
    // Clear any existing timer
    if (dragTimerRef.current) {
      clearTimeout(dragTimerRef.current);
    }
  }, [handleMarkerHover]);
  
  const handleMapDragEnd = useCallback(() => {
    // Optimized delay to prevent immediate popup reappearance
    if (dragTimerRef.current) {
      clearTimeout(dragTimerRef.current);
    }
    
    dragTimerRef.current = setTimeout(() => {
      setHideMarkerPopups(false);
      dragTimerRef.current = null;
    }, 200);
  }, []);
  
  // Handle zoom start/end events
  const handleMapZoomStart = useCallback(() => {
    setHideMarkerPopups(true);
    handleZoomStart();
    
    if (zoomTimerRef.current) {
      clearTimeout(zoomTimerRef.current);
    }
  }, [handleZoomStart]);
  
  const handleMapZoomEnd = useCallback(() => {
    handleZoomEnd();
    
    if (zoomTimerRef.current) {
      clearTimeout(zoomTimerRef.current);
    }
    
    zoomTimerRef.current = setTimeout(() => {
      setHideMarkerPopups(false);
      zoomTimerRef.current = null;
    }, 300);
  }, [handleZoomEnd]);
  
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
    handleMarkerHover: handleHover,
    handleLocationClick,
    handleMapDragStart,
    handleMapDragEnd,
    handleMapZoomStart,
    handleMapZoomEnd
  };
};

export default useMapInteractions;

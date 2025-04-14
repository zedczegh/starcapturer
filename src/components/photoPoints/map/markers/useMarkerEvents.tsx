
import { useCallback, useRef } from 'react';
import L from 'leaflet';
import { useIsMobile } from '@/hooks/use-mobile';

interface UseMarkerEventsProps {
  locationId: string;
  onHover: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
}

export const useMarkerEvents = ({
  locationId,
  onHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove
}: UseMarkerEventsProps) => {
  const markerRef = useRef<L.Marker | null>(null);
  const isMobile = useIsMobile();
  const touchStartedRef = useRef(false);
  const touchMoveCountRef = useRef(0);
  
  // Handle hover events with improved hover handling - now visual only, no auto-zoom
  const handleMouseOver = useCallback(() => {
    onHover(locationId);
    
    // Add hovered class to marker for style enhancement only
    const marker = markerRef.current;
    if (marker && marker.getElement()) {
      marker.getElement()?.classList.add('hovered');
    }
  }, [locationId, onHover]);
  
  const handleMouseOut = useCallback(() => {
    onHover(null);
    
    // Remove hovered class
    const marker = markerRef.current;
    if (marker && marker.getElement()) {
      marker.getElement()?.classList.remove('hovered');
    }
  }, [onHover]);
  
  // Handle custom touch events for better mobile experience
  const handleMarkerTouchStart = useCallback((e: TouchEvent) => {
    touchStartedRef.current = true;
    touchMoveCountRef.current = 0;
    
    if (handleTouchStart) {
      // Convert TouchEvent to React.TouchEvent
      const syntheticEvent = e as unknown as React.TouchEvent;
      handleTouchStart(syntheticEvent, locationId);
    }
    
    // Prevent default behavior to avoid map panning when touching marker
    // This makes markers reliably clickable on mobile
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Add hovered class to marker for style enhancement
    const marker = markerRef.current;
    if (marker && marker.getElement()) {
      marker.getElement()?.classList.add('hovered');
    }
    
    // For mobile, only highlight, don't auto-open popup
    if (isMobile) {
      onHover(locationId);
    }
  }, [locationId, handleTouchStart, onHover, isMobile]);
  
  const handleMarkerTouchEnd = useCallback((e: TouchEvent) => {
    // Only process as a click if minimal movement occurred
    const wasStationary = touchMoveCountRef.current < 5;
    
    if (handleTouchEnd && wasStationary) {
      // Convert TouchEvent to React.TouchEvent
      const syntheticEvent = e as unknown as React.TouchEvent;
      handleTouchEnd(syntheticEvent, locationId);
    }
    
    // For click detection on mobile
    if (isMobile && wasStationary) {
      const marker = markerRef.current;
      if (marker) {
        // Toggle popup instead of auto-opening
        if (marker.isPopupOpen()) {
          marker.closePopup();
        } else {
          marker.openPopup();
        }
      }
    }
    
    touchStartedRef.current = false;
  }, [locationId, handleTouchEnd, isMobile]);
  
  const handleMarkerTouchMove = useCallback((e: TouchEvent) => {
    // Count movements to detect drag vs tap
    touchMoveCountRef.current += 1;
    
    // After certain threshold, consider it a drag
    if (touchMoveCountRef.current > 5) {
      // Reset touch state if dragging
      touchStartedRef.current = false;
      
      // Remove hover effect during drag
      const marker = markerRef.current;
      if (marker && marker.getElement()) {
        marker.getElement()?.classList.remove('hovered');
      }
      
      // Hide popup if dragging
      onHover(null);
    }
    
    if (handleTouchMove) {
      // Convert TouchEvent to React.TouchEvent
      const syntheticEvent = e as unknown as React.TouchEvent;
      handleTouchMove(syntheticEvent);
    }
  }, [handleTouchMove, onHover]);

  // Create a complete event map with improved handling
  const eventMap = {
    // Mouse events (primarily desktop)
    mouseover: handleMouseOver,
    mouseout: handleMouseOut,
    
    // Touch events (primarily mobile)
    touchstart: handleMarkerTouchStart,
    touchend: handleMarkerTouchEnd,
    touchmove: handleMarkerTouchMove,
    
    // Click event to toggle popup (desktop and mobile)
    click: () => {
      const marker = markerRef.current;
      if (marker) {
        // Toggle popup instead of auto-opening
        if (marker.isPopupOpen()) {
          marker.closePopup();
        } else {
          marker.openPopup();
          onHover(locationId);
        }
      }
    }
  };
  
  return { markerRef, eventMap };
};

export default useMarkerEvents;

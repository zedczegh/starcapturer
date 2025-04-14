
import { useCallback, useRef } from 'react';
import L from 'leaflet';

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
  
  // Handle hover events with improved hover handling
  const handleMouseOver = useCallback(() => {
    onHover(locationId);
    
    // Add hovered class to marker for style enhancement
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
    if (handleTouchStart) {
      // Convert TouchEvent to React.TouchEvent
      const syntheticEvent = e as unknown as React.TouchEvent;
      handleTouchStart(syntheticEvent, locationId);
    }
    
    // Add hovered class to marker for style enhancement
    const marker = markerRef.current;
    if (marker && marker.getElement()) {
      marker.getElement()?.classList.add('hovered');
    }
  }, [locationId, handleTouchStart]);
  
  const handleMarkerTouchEnd = useCallback((e: TouchEvent) => {
    if (handleTouchEnd) {
      // Convert TouchEvent to React.TouchEvent
      const syntheticEvent = e as unknown as React.TouchEvent;
      handleTouchEnd(syntheticEvent, locationId);
    }
  }, [locationId, handleTouchEnd]);
  
  const handleMarkerTouchMove = useCallback((e: TouchEvent) => {
    if (handleTouchMove) {
      // Convert TouchEvent to React.TouchEvent
      const syntheticEvent = e as unknown as React.TouchEvent;
      handleTouchMove(syntheticEvent);
    }
  }, [handleTouchMove]);

  const eventMap = {
    mouseover: handleMouseOver,
    mouseout: handleMouseOut,
    touchstart: handleMarkerTouchStart,
    touchend: handleMarkerTouchEnd,
    touchmove: handleMarkerTouchMove
  };
  
  return { markerRef, eventMap };
};

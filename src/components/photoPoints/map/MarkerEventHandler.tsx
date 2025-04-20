
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface MarkerEventHandlerProps {
  marker: L.Marker | null;
  eventMap: {
    click?: () => void;
    mouseover?: () => void;
    mouseout?: () => void;
    touchstart?: (e: TouchEvent) => void;
    touchend?: (e: TouchEvent) => void;
    touchmove?: (e: TouchEvent) => void;
  };
}

/**
 * Helper component to attach event handlers to Leaflet markers
 * Works around TypeScript limitations with react-leaflet
 */
const MarkerEventHandler: React.FC<MarkerEventHandlerProps> = ({ marker, eventMap }) => {
  const handlers = useRef<any[]>([]);
  
  useEffect(() => {
    if (!marker) return;
    
    // Clean up any existing handlers
    handlers.current.forEach(h => {
      if (h.event && h.handler) {
        marker.off(h.event, h.handler);
      }
    });
    
    handlers.current = [];
    
    // Attach new handlers
    Object.entries(eventMap).forEach(([event, handler]) => {
      if (handler) {
        marker.on(event, handler);
        handlers.current.push({ event, handler });
      }
    });
    
    // Cleanup on unmount
    return () => {
      handlers.current.forEach(h => {
        if (h.event && h.handler && marker) {
          marker.off(h.event, h.handler);
        }
      });
    };
  }, [marker, eventMap]);
  
  return null;
};

export default MarkerEventHandler;

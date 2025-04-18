
import React, { useEffect } from 'react';
import L from 'leaflet';

interface EventMap {
  mouseover?: () => void;
  mouseout?: () => void;
  touchstart?: (e: any) => void;
  touchend?: (e: any) => void;
  touchmove?: (e: any) => void;
}

interface MarkerEventHandlerProps {
  marker: L.Marker | null;
  eventMap: EventMap;
}

const MarkerEventHandler: React.FC<MarkerEventHandlerProps> = ({ marker, eventMap }) => {
  useEffect(() => {
    if (!marker) return;

    // Get the element from the marker
    const el = marker.getElement();
    if (!el) return;

    // Add all event listeners
    Object.entries(eventMap).forEach(([event, handler]) => {
      if (handler) {
        el.addEventListener(event, handler);
      }
    });

    // Clean up event listeners
    return () => {
      Object.entries(eventMap).forEach(([event, handler]) => {
        if (handler) {
          el.removeEventListener(event, handler);
        }
      });
    };
  }, [marker, eventMap]);

  return null;
};

export default MarkerEventHandler;


import React, { useRef, useEffect } from 'react';
import L from 'leaflet';

interface MarkerEventHandlerProps {
  marker: L.Marker | null;
  eventMap: Record<string, (e: any) => void>;
}

/**
 * Component to attach event handlers to Leaflet markers
 * This is needed because Leaflet's native events don't always work well with React
 */
const MarkerEventHandler: React.FC<MarkerEventHandlerProps> = ({ marker, eventMap }) => {
  const eventsRef = useRef<Record<string, (e: any) => void>>(eventMap);
  
  // Update events ref when eventMap changes
  useEffect(() => {
    eventsRef.current = eventMap;
  }, [eventMap]);
  
  // Attach events to marker when marker changes
  useEffect(() => {
    if (!marker) return;
    
    // Get marker element from Leaflet marker
    const element = marker.getElement();
    if (!element) return;
    
    // Attach all event handlers
    Object.entries(eventsRef.current).forEach(([eventName, handler]) => {
      element.addEventListener(eventName, handler);
    });
    
    // Cleanup on unmount
    return () => {
      if (!element) return;
      
      // Remove all event handlers
      Object.entries(eventsRef.current).forEach(([eventName, handler]) => {
        element.removeEventListener(eventName, handler);
      });
    };
  }, [marker]);
  
  return null;
};

export default MarkerEventHandler;

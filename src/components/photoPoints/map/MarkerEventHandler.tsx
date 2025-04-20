
import { useEffect, useRef } from 'react';
import { Marker } from 'leaflet';

type EventMap = {
  [key: string]: (e: any) => void;
};

interface MarkerEventHandlerProps {
  marker: Marker | null;
  eventMap: EventMap;
}

/**
 * A component to safely attach event handlers to Leaflet markers
 * Helps prevent "Cannot read properties of undefined (reading '_leaflet_pos')" errors
 */
const MarkerEventHandler = ({ marker, eventMap }: MarkerEventHandlerProps) => {
  const handlerRefs = useRef<{ [key: string]: (e: any) => void }>({});
  
  useEffect(() => {
    if (!marker) return;
    
    // Create stable reference functions for each event handler
    Object.entries(eventMap).forEach(([event, handler]) => {
      // Wrap each handler in a try/catch to prevent errors from crashing the app
      handlerRefs.current[event] = (e: any) => {
        try {
          // Check if marker is valid before calling handler
          if (marker && marker.getLatLng) {
            handler(e);
          }
        } catch (error) {
          console.warn(`Error in marker ${event} handler:`, error);
        }
      };
      
      // Attach the event handler
      marker.on(event, handlerRefs.current[event]);
    });
    
    // Cleanup function to remove event listeners
    return () => {
      if (!marker) return;
      
      Object.entries(eventMap).forEach(([event]) => {
        if (handlerRefs.current[event]) {
          try {
            marker.off(event, handlerRefs.current[event]);
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      });
    };
  }, [marker, eventMap]);
  
  return null;
};

export default MarkerEventHandler;

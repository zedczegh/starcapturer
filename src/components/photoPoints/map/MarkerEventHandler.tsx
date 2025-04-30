
import React, { useEffect } from 'react';
import { useLeafletContext } from '@react-leaflet/core';
import L from 'leaflet';

interface EventMap {
  [key: string]: ((e: any) => void) | undefined;
}

interface MarkerEventHandlerProps {
  marker: L.Marker | null;
  eventMap: EventMap;
}

const MarkerEventHandler: React.FC<MarkerEventHandlerProps> = ({ marker, eventMap }) => {
  const context = useLeafletContext();

  useEffect(() => {
    const container = context.layerContainer || context.map;
    const instance = marker || container;

    // Add event handlers
    Object.entries(eventMap).forEach(([event, handler]) => {
      if (handler) {
        instance.on(event, handler);
      }
    });

    // Clean up
    return () => {
      Object.entries(eventMap).forEach(([event, handler]) => {
        if (handler) {
          instance.off(event, handler);
        }
      });
    };
  }, [context, marker, eventMap]);

  return null;
};

export default MarkerEventHandler;

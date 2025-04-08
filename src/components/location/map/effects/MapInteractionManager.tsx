
import React, { useEffect } from "react";
import { useMap } from "react-leaflet";

/**
 * Component to handle map interactivity settings
 */
export function MapInteractionManager({
  draggable = true,
  zoomable = true,
  onReady
}: {
  draggable?: boolean;
  zoomable?: boolean;
  onReady?: () => void;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    // Set dragging state
    if (draggable) {
      map.dragging.enable();
    } else {
      map.dragging.disable();
    }
    
    // Set zoom state
    if (zoomable) {
      map.scrollWheelZoom.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
    }
    
    // Call onReady callback if provided
    if (onReady) {
      onReady();
    }
  }, [map, draggable, zoomable, onReady]);
  
  return null;
}

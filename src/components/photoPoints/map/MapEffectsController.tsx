
import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapEffectsControllerProps {
  onMapClick: (lat: number, lng: number) => void;
  disableAutoZoom?: boolean;
}

// More forgiving world bounds controller with no auto-zoom
export const WorldBoundsController: React.FC = () => {
  const map = useMap();
  const initialized = useRef(false);
  
  useEffect(() => {
    if (!map || initialized.current) return;
    initialized.current = true;
    
    // Set more forgiving max bounds
    const worldBounds = new L.LatLngBounds(
      new L.LatLng(-90, -200), // Significantly extended bounds
      new L.LatLng(90, 200)    // Significantly extended bounds
    );
    
    map.setMaxBounds(worldBounds);
    
    // Gentler handling of edge cases
    const handleDrag = () => {
      const center = map.getCenter();
      let lat = center.lat;
      let lng = center.lng;
      
      // More forgiving latitude bounds
      if (lat > 89) lat = 89;
      if (lat < -89) lat = -89;
      
      // Smoother longitude wrapping
      if (lng < -180) lng += 360;
      if (lng > 180) lng -= 360;
      
      // Only pan if really needed - prevent unnecessary rendering
      if (lat !== center.lat || lng !== center.lng) {
        map.panTo(new L.LatLng(lat, lng), { animate: false });
      }
    };
    
    map.on('drag', handleDrag);
    
    // Disable ALL automatic zoom animations
    if (map.options) {
      map.options.zoomAnimation = false;
      map.options.markerZoomAnimation = false;
    }
    
    // Ensure touch handling is optimized
    if (map.dragging && map.dragging.enable) {
      map.dragging.enable();
    }
    
    if (map.touchZoom && map.touchZoom.enable) {
      map.touchZoom.enable();
    }
    
    return () => {
      map.off('drag', handleDrag);
    };
  }, [map]);
  
  return null;
};

export const MapEvents: React.FC<MapEffectsControllerProps> = ({ onMapClick, disableAutoZoom = true }) => {
  const map = useMap();
  const clickHandlerRef = useRef<((e: L.LeafletMouseEvent) => void) | null>(null);

  // Set up map click event handler with proper cleanup
  useEffect(() => {
    if (!map) return;
    
    // Disable animations to prevent flashing
    if (disableAutoZoom && map.options) {
      map.options.zoomAnimation = false;
      map.options.markerZoomAnimation = false;
    }
    
    // Remove any existing handler to prevent duplicates
    if (clickHandlerRef.current) {
      map.off('click', clickHandlerRef.current);
    }

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    // Store reference to handler for cleanup
    clickHandlerRef.current = handleMapClick;
    map.on('click', handleMapClick);

    return () => {
      if (clickHandlerRef.current) {
        map.off('click', clickHandlerRef.current);
      }
    };
  }, [map, onMapClick, disableAutoZoom]);

  return null;
};

export default MapEvents;

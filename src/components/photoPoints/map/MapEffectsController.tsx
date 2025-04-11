
import React, { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Component to enforce world bounds and prevent infinite scrolling
export const WorldBoundsController: React.FC = () => {
  const map = useMap();
  const initializedRef = useRef(false);
  
  useEffect(() => {
    // Only run once
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    if (map) {
      const worldBounds = L.latLngBounds(
        L.latLng(-85, -180),
        L.latLng(85, 180)
      );
      
      map.setMaxBounds(worldBounds);
      map.on('drag', () => {
        map.panInsideBounds(worldBounds, { animate: false });
      });
    }
  }, [map]);
  
  return null;
};

// Handler component for map events
export const MapEvents: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
  onMapDragStart?: () => void;
  onMapDragEnd?: () => void;
  onMapZoomEnd?: () => void;
}> = ({
  onMapClick,
  onMapDragStart,
  onMapDragEnd,
  onMapZoomEnd
}) => {
  const map = useMap();
  const eventsInitializedRef = useRef(false);
  
  // Use useCallback to prevent unnecessary rerenders
  const handleClick = useCallback((e: L.LeafletMouseEvent) => {
    onMapClick(e.latlng.lat, e.latlng.lng);
  }, [onMapClick]);
  
  useEffect(() => {
    // Only set up events once
    if (eventsInitializedRef.current) return;
    eventsInitializedRef.current = true;
    
    map.on('click', handleClick);
    
    if (onMapDragStart) {
      map.on('dragstart', onMapDragStart);
    }
    
    if (onMapDragEnd) {
      map.on('dragend', onMapDragEnd);
    }
    
    if (onMapZoomEnd) {
      map.on('zoomend', onMapZoomEnd);
    }
    
    return () => {
      map.off('click', handleClick);
      if (onMapDragStart) map.off('dragstart', onMapDragStart);
      if (onMapDragEnd) map.off('dragend', onMapDragEnd);
      if (onMapZoomEnd) map.off('zoomend', onMapZoomEnd);
    };
  }, [map, handleClick, onMapDragStart, onMapDragEnd, onMapZoomEnd]);
  
  return null;
};

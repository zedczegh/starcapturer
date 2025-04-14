
import React, { useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapEventsProps {
  onMapClick?: (lat: number, lng: number) => void;
  onMapDragStart?: () => void;
  onMapDragEnd?: () => void;
  onMapZoomEnd?: () => void;
}

export function MapEvents({ 
  onMapClick,
  onMapDragStart,
  onMapDragEnd,
  onMapZoomEnd
}: MapEventsProps) {
  const map = useMap();
  
  // Handle map click
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (onMapClick) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  }, [onMapClick]);
  
  // Set up event listeners
  useEffect(() => {
    if (!map) return;
    
    if (onMapClick) {
      map.on('click', handleMapClick);
    }
    
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
      if (onMapClick) {
        map.off('click', handleMapClick);
      }
      
      if (onMapDragStart) {
        map.off('dragstart', onMapDragStart);
      }
      
      if (onMapDragEnd) {
        map.off('dragend', onMapDragEnd);
      }
      
      if (onMapZoomEnd) {
        map.off('zoomend', onMapZoomEnd);
      }
    };
  }, [map, handleMapClick, onMapDragStart, onMapDragEnd, onMapZoomEnd]);
  
  return null;
}

export function WorldBoundsController() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    
    // Set max bounds to prevent scrolling beyond world boundaries
    const worldBounds = L.latLngBounds(
      L.latLng(-85.0511, -190), // Southwest corner
      L.latLng(85.0511, 190)   // Northeast corner
    );
    
    map.setMaxBounds(worldBounds);
    map.on('drag', () => {
      map.panInsideBounds(worldBounds, { animate: false });
    });
    
    return () => {
      map.off('drag');
    };
  }, [map]);

  return null;
}

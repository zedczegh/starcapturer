
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Map Events component to handle click events and updates
 */
export const MapEvents = ({ 
  onMapClick, 
  onMapDragStart, 
  onMapDragEnd,
  onMapZoomEnd 
}: { 
  onMapClick: (lat: number, lng: number) => void;
  onMapDragStart?: () => void;
  onMapDragEnd?: () => void;
  onMapZoomEnd?: () => void;
}) => {
  const map = useMap();
  
  // Set up event listeners
  useEffect(() => {
    if (!map) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    const handleDragStart = () => {
      if (onMapDragStart) onMapDragStart();
    };
    
    const handleDragEnd = () => {
      if (onMapDragEnd) onMapDragEnd();
    };
    
    const handleZoomEnd = () => {
      if (onMapZoomEnd) onMapZoomEnd();
    };
    
    map.on('click', handleClick);
    map.on('dragstart', handleDragStart);
    map.on('dragend', handleDragEnd);
    map.on('zoomend', handleZoomEnd);
    
    // Store map reference in window for external access
    (window as any).leafletMap = map;
    
    return () => {
      // Clean up event listeners
      map.off('click', handleClick);
      map.off('dragstart', handleDragStart);
      map.off('dragend', handleDragEnd);
      map.off('zoomend', handleZoomEnd);
      // Clean up window reference
      delete (window as any).leafletMap;
    };
  }, [map, onMapClick, onMapDragStart, onMapDragEnd, onMapZoomEnd]);
  
  return null;
};

/**
 * Map utility component for rendering world bounds
 */
export const WorldBoundsController = () => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    // Set world bounds to prevent infinite horizontal scrolling
    const worldBounds = L.latLngBounds(
      L.latLng(-90, -180),  // Southwest corner
      L.latLng(90, 180)     // Northeast corner
    );
    
    map.setMaxBounds(worldBounds);
    map.options.maxBoundsViscosity = 1.0; // Make bounds "sticky"
    
    return () => {
      // Cleanup if needed
    };
  }, [map]);
  
  return null;
};

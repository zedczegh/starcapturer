
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// World bounds controller to ensure markers stay within viewport
export const WorldBoundsController = () => {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    
    // Set minimum zoom to prevent markers from disappearing
    map.setMinZoom(2);
    
    // Set maximum bounds to prevent panning outside world boundaries
    const bounds = L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180));
    map.setMaxBounds(bounds);
    
    return () => {
      // No cleanup needed
    };
  }, [map]);
  
  return null;
};

// Define interface to match required props
export interface MapEventsProps {
  onMapClick: (lat: number, lng: number) => void;
  onMapDragStart?: () => void;
  onMapDragEnd?: () => void;
}

// Map Events Component - Handles map click events
export const MapEvents = ({ 
  onMapClick, 
  onMapDragStart, 
  onMapDragEnd
}: MapEventsProps) => {
  const map = useMap();
  
  // Use direct event listener instead of useMapEvents
  useEffect(() => {
    if (!map) return;
    
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    const handleDragStart = () => {
      if (onMapDragStart) onMapDragStart();
    };
    
    const handleDragEnd = () => {
      if (onMapDragEnd) onMapDragEnd();
    };
    
    const handleZoomStart = () => {
      // We'll handle zoom events in the map container directly
    };
    
    const handleZoomEnd = () => {
      // We'll handle zoom events in the map container directly
    };
    
    map.on('click', handleMapClick);
    
    if (onMapDragStart) map.on('dragstart', handleDragStart);
    if (onMapDragEnd) map.on('dragend', handleDragEnd);
    
    return () => {
      map.off('click', handleMapClick);
      if (onMapDragStart) map.off('dragstart', handleDragStart);
      if (onMapDragEnd) map.off('dragend', handleDragEnd);
    };
  }, [map, onMapClick, onMapDragStart, onMapDragEnd]);
  
  return null;
};

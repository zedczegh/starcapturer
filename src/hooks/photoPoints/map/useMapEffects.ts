
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export const useMapEffects = (searchRadius: number, userLocation: { latitude: number; longitude: number } | null) => {
  const map = useMap();
  const initialized = useRef(false);

  useEffect(() => {
    if (!map || initialized.current) return;
    initialized.current = true;
    
    // Set max bounds to prevent scrolling beyond the world
    const worldBounds = new L.LatLngBounds(
      new L.LatLng(-85.06, -180),
      new L.LatLng(85.06, 180)
    );
    
    map.setMaxBounds(worldBounds);
    
    const handleDrag = () => {
      map.panInsideBounds(worldBounds, { animate: false });
    };
    
    map.on('drag', handleDrag);
    
    // Mobile optimizations
    if (map.dragging && map.dragging.enable) {
      map.dragging.enable();
    }
    
    if (map.touchZoom && map.touchZoom.enable) {
      map.touchZoom.enable();
    }
    
    // Set lower inertia for smoother mobile dragging
    if (map.dragging && map.dragging._draggable) {
      try {
        const draggable = map.dragging._draggable;
        if (draggable._inertia) {
          draggable._inertia.threshold = 20;
          draggable._inertia.deceleration = 3000;
        }
      } catch (error) {
        console.error("Error optimizing map dragging:", error);
      }
    }
    
    return () => {
      map.off('drag', handleDrag);
    };
  }, [map]);
};

export default useMapEffects;

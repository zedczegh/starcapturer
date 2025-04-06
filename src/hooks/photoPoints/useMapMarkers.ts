
import { useCallback, useState, useRef } from 'react';
import L from 'leaflet';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import { getProgressColor } from '@/components/siqs/utils/progressColor';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

export const useMapMarkers = () => {
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());

  // Create a SIQS-colored marker
  const getSiqsMarker = useCallback((siqs: number | undefined) => {
    if (!siqs) return createCustomMarker('#777777'); // Gray for unknown SIQS
    
    const color = getProgressColor(siqs);
    return createCustomMarker(color);
  }, []);

  // Create a user location marker
  const getUserMarker = useCallback(() => {
    return createCustomMarker('#9b87f5'); // Violet for user location (matching logo color)
  }, []);

  // Register a marker reference
  const registerMarker = useCallback((id: string, marker: L.Marker) => {
    markerRefs.current.set(id, marker);
  }, []);

  // Get a marker reference
  const getMarker = useCallback((id: string) => {
    return markerRefs.current.get(id);
  }, []);

  // Handle hover state
  const handleHover = useCallback((id: string | null) => {
    setHoveredLocationId(id);
    
    // Close all popups except the hovered one
    markerRefs.current.forEach((marker, markerId) => {
      if (id === markerId) {
        marker.openPopup();
      } else {
        marker.closePopup();
      }
    });
  }, []);

  return {
    hoveredLocationId,
    setHoveredLocationId,
    getSiqsMarker,
    getUserMarker,
    registerMarker,
    getMarker,
    handleHover
  };
};

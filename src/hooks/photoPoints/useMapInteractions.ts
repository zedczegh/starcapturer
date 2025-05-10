
import { useState, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface UseMapInteractionsProps {
  onLocationClick: (location: SharedAstroSpot) => void;
}

export function useMapInteractions({ onLocationClick }: UseMapInteractionsProps) {
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const [hideMarkerPopups, setHideMarkerPopups] = useState(false);
  
  // Handle hover events
  const handleMarkerHover = useCallback((id: string | null) => {
    setHoveredLocationId(id);
  }, []);
  
  // Handle location click
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick]);
  
  // Handle map drag events
  const handleMapDragStart = useCallback(() => {
    setHideMarkerPopups(true);
  }, []);
  
  const handleMapDragEnd = useCallback(() => {
    setHideMarkerPopups(false);
  }, []);
  
  return {
    hoveredLocationId,
    hideMarkerPopups,
    handleMarkerHover,
    handleLocationClick,
    handleMapDragStart,
    handleMapDragEnd
  };
}


import { useState, useCallback } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface UseMapInteractionsProps {
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMarkerHover?: (id: string | null) => void;
}

/**
 * Hook to manage map interactions like hover, click, and drag
 */
const useMapInteractions = ({
  onLocationClick,
  onMarkerHover
}: UseMapInteractionsProps) => {
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Handle hover events
  const handleMarkerHover = useCallback((id: string | null) => {
    setHoveredLocationId(id);
    if (onMarkerHover) {
      onMarkerHover(id);
    }
  }, [onMarkerHover]);
  
  // Handle click events
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick]);
  
  // Handle drag events
  const handleMapDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);
  
  const handleMapDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  return {
    hoveredLocationId,
    isDragging,
    handleMarkerHover,
    handleLocationClick,
    handleMapDragStart,
    handleMapDragEnd
  };
};

export default useMapInteractions;

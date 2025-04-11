
import { useState, useCallback } from 'react';

/**
 * Hook to manage map marker hover state
 * This helps reduce complexity in the PhotoPointsMap component
 * @returns Object with hover state and handler
 */
export const useMapMarkers = () => {
  const [hoveredLocationId, setHoveredLocationId] = useState<string | null>(null);
  
  // Handle hover on markers
  const handleHover = useCallback((id: string | null) => {
    setHoveredLocationId(id);
  }, []);
  
  return {
    hoveredLocationId,
    handleHover
  };
};

/**
 * Hook to get the base URL for map tiles based on map provider
 * @param provider Map provider name
 * @returns URL template for map tiles
 */
export const useMapTileProvider = (provider = 'openstreetmap') => {
  switch (provider) {
    case 'openstreetmap':
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    case 'stamen':
      return 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png';
    case 'dark':
      // Dark mode map tiles - better for astronomy apps
      return 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png';
    default:
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  }
};

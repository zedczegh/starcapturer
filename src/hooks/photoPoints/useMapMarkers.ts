
import React, { useState, useMemo } from 'react';
import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Use a function to efficiently chunk marker rendering
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Hook to manage map markers with optimized rendering
 */
export const useMapMarkers = (locations: SharedAstroSpot[], mapRendered: boolean) => {
  const [hideMarkerPopups, setHideMarkerPopups] = useState(false);
  const [markerChunks, setMarkerChunks] = useState<SharedAstroSpot[][]>([]);
  
  // Filter out any invalid locations
  const validLocations = useMemo(() => {
    return locations.filter(location => 
      location && 
      typeof location.latitude === 'number' && 
      typeof location.longitude === 'number' &&
      isFinite(location.latitude) &&
      isFinite(location.longitude) &&
      Math.abs(location.latitude) <= 90 &&
      Math.abs(location.longitude) <= 180
    );
  }, [locations]);
  
  // Handle map interaction to hide popups while interacting
  const handleMapDragStart = () => {
    setHideMarkerPopups(true);
  };
  
  const handleMapDragEnd = () => {
    // Small delay to prevent immediate popup reappearance
    setTimeout(() => {
      setHideMarkerPopups(false);
    }, 100);
  };
  
  // Chunk locations for better rendering performance
  React.useEffect(() => {
    if (validLocations.length > 0 && mapRendered) {
      // Get optimal chunk size based on location count
      const chunkSize = validLocations.length > 100 ? 30 : 50;
      setMarkerChunks(chunkArray(validLocations, chunkSize));
    }
  }, [validLocations, mapRendered]);
  
  return {
    validLocations,
    markerChunks,
    hideMarkerPopups,
    handleMapDragStart,
    handleMapDragEnd,
    setHideMarkerPopups
  };
};

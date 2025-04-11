
import { useState, useCallback, useEffect, useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useMapLocations } from './useMapLocations';
import { useMapUtils } from './useMapUtils';

interface UsePhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
}

export const usePhotoPointsMap = ({
  userLocation,
  locations,
  searchRadius,
  activeView
}: UsePhotoPointsMapProps) => {
  const [mapReady, setMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SharedAstroSpot | null>(null);
  const previousLocationRef = useRef<{latitude: number, longitude: number} | null>(null);

  // Use map utilities
  const { getZoomLevel, handleLocationClick } = useMapUtils();
  
  // Use the location processing hook
  const { processedLocations } = useMapLocations({
    userLocation,
    locations,
    searchRadius,
    activeView,
    mapReady
  });

  // Track location changes
  useEffect(() => {
    if (!userLocation) return;
    
    // Check if location has changed significantly
    const locationChanged = !previousLocationRef.current ||
      Math.abs(previousLocationRef.current.latitude - userLocation.latitude) > 0.01 ||
      Math.abs(previousLocationRef.current.longitude - userLocation.longitude) > 0.01;
    
    if (locationChanged) {
      previousLocationRef.current = userLocation;
    }
  }, [userLocation]);

  // Calculate map center coordinates
  const mapCenter: [number, number] = userLocation 
    ? [userLocation.latitude, userLocation.longitude]
    : processedLocations.length > 0
      ? [processedLocations[0].latitude, processedLocations[0].longitude]
      : [39.9042, 116.4074]; // Default center (Beijing)

  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  const initialZoom = getZoomLevel(searchRadius);

  return {
    mapReady,
    handleMapReady,
    selectedLocation,
    handleLocationClick,
    validLocations: processedLocations,
    mapCenter,
    initialZoom
  };
};

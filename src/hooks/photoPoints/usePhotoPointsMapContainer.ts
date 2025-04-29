
import { useState, useCallback, useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import useMapMarkers from '@/hooks/map/useMapMarkers';
import { usePhotoPointsMap } from '@/hooks/photoPoints/usePhotoPointsMap';
import { useMapState } from './map/useMapState';
import { useLocationManagement } from './map/useLocationManagement';
import { useLocationsPersistence } from './map/useLocationsPersistence';

interface UsePhotoPointsMapContainerProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onLocationUpdate?: (latitude: number, longitude: number) => void;
  showForecast?: boolean;
  forecastDay?: number;
}

export const usePhotoPointsMapContainer = ({
  userLocation,
  locations,
  certifiedLocations,
  calculatedLocations,
  activeView,
  searchRadius,
  onLocationClick,
  onLocationUpdate,
  showForecast = false,
  forecastDay = 1
}: UsePhotoPointsMapContainerProps) => {
  const [mapReady, setMapReady] = useState(false);
  
  const { 
    mapContainerHeight,
    legendOpen,
    isUpdatingLocation,
    handleLegendToggle,
    isMobile
  } = useMapState();
  
  const {
    handleMapClick,
    handleGetLocation
  } = useLocationManagement(onLocationUpdate);
  
  const { 
    hoveredLocationId, 
    handleHover,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove
  } = useMapMarkers();
  
  const { 
    mapReady: mapIsReady,
    handleMapReady,
    validLocations,
    mapCenter,
    initialZoom,
    certifiedLocationsLoaded,
    certifiedLocationsLoading
  } = usePhotoPointsMap({
    userLocation,
    locations: locations,
    searchRadius,
    activeView,
    showForecast,
    forecastDay
  });
  
  // Use locations persistence hook when not in forecast mode
  useLocationsPersistence(showForecast ? [] : locations, activeView);
  
  const handleLocationClicked = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick]);

  return {
    mapContainerHeight,
    legendOpen,
    mapReady: mapIsReady,
    handleMapReady,
    optimizedLocations: validLocations,
    mapCenter,
    initialZoom,
    hoveredLocationId,
    handleHover,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    handleMapClick,
    handleLocationClicked,
    handleGetLocation,
    handleLegendToggle,
    isMobile,
    certifiedLocationsLoaded,
    certifiedLocationsLoading
  };
};


import React, { useState, useCallback, useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import useMapMarkers from '@/hooks/photoPoints/useMapMarkers';
import { useIsMobile } from '@/hooks/use-mobile';
import LazyMapContainer from './LazyMapContainer';
import { usePhotoPointsMap } from '@/hooks/photoPoints/usePhotoPointsMap';
import MapLegend from './MapLegend';
import CenteringPinpointButton from './CenteringPinpointButton';

interface PhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onLocationUpdate?: (latitude: number, longitude: number) => void;
}

const PhotoPointsMap: React.FC<PhotoPointsMapProps> = ({
  userLocation,
  locations,
  activeView,
  searchRadius,
  onLocationClick,
  onLocationUpdate
}) => {
  const { 
    hoveredLocationId, 
    handleHover,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove
  } = useMapMarkers();
  
  const isMobile = useIsMobile();
  const [legendOpen, setLegendOpen] = useState(false);
  
  const { 
    mapReady,
    handleMapReady,
    handleLocationClick,
    validLocations,
    mapCenter,
    initialZoom
  } = usePhotoPointsMap({
    userLocation,
    locations,
    searchRadius,
    activeView
  });

  const handleLocationClicked = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    } else {
      handleLocationClick(location);
    }
  }, [onLocationClick, handleLocationClick]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onLocationUpdate) {
      onLocationUpdate(lat, lng);
    }
  }, [onLocationUpdate]);

  const handleLegendToggle = useCallback((isOpen: boolean) => {
    setLegendOpen(isOpen);
  }, []);

  return (
    <div className="w-full relative rounded-md overflow-hidden transition-all duration-300 mb-4 mt-2" style={{ height: isMobile ? 'calc(70vh - 200px)' : '450px' }}>
      <LazyMapContainer
        center={mapCenter}
        userLocation={userLocation}
        locations={validLocations}
        searchRadius={searchRadius}
        activeView={activeView}
        onMapReady={handleMapReady}
        onLocationClick={handleLocationClicked}
        onMapClick={handleMapClick}
        zoom={initialZoom}
        hoveredLocationId={hoveredLocationId}
        onMarkerHover={handleHover}
        handleTouchStart={handleTouchStart}
        handleTouchEnd={handleTouchEnd}
        handleTouchMove={handleTouchMove}
        isMobile={isMobile}
        useMobileMapFixer={true}
        showRadiusCircles={activeView === 'calculated'}
      />
      
      <MapLegend 
        activeView={activeView}
        showStarLegend={activeView === 'certified'}
        showCircleLegend={activeView === 'calculated'}
        onToggle={handleLegendToggle}
        className="absolute bottom-4 right-4"
      />
      
      {!legendOpen && (
        <CenteringPinpointButton 
          userLocation={userLocation}
          className="absolute top-4 right-4"
        />
      )}
    </div>
  );
};

export default PhotoPointsMap;

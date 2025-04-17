
import React from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { usePhotoPointsMapContainer } from '@/hooks/photoPoints/usePhotoPointsMapContainer';
import MapContainer from './MapContainer';
import PageLoader from '@/components/loaders/PageLoader';

interface PhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onLocationUpdate?: (latitude: number, longitude: number) => void;
}

const PhotoPointsMap: React.FC<PhotoPointsMapProps> = (props) => { 
  const { 
    userLocation,
    locations,
    certifiedLocations,
    calculatedLocations,
    activeView,
    searchRadius,
    onLocationClick,
    onLocationUpdate
  } = props;
  
  console.log(`PhotoPointsMap rendering - activeView: ${activeView}, locations: ${locations?.length || 0}, certified: ${certifiedLocations?.length || 0}, calculated: ${calculatedLocations?.length || 0}`);
  
  const {
    mapContainerHeight,
    mapReady,
    handleMapReady,
    optimizedLocations,
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
    isMobile
  } = usePhotoPointsMapContainer({
    userLocation,
    locations,
    certifiedLocations,
    calculatedLocations,
    activeView,
    searchRadius,
    onLocationClick,
    onLocationUpdate
  });
  
  console.log(`PhotoPointsMap: optimizedLocations=${optimizedLocations?.length || 0}, mapReady=${mapReady}`);
  
  return (
    <MapContainer
      userLocation={userLocation}
      locations={optimizedLocations}
      searchRadius={searchRadius}
      activeView={activeView}
      mapReady={mapReady}
      handleMapReady={handleMapReady}
      handleLocationClicked={handleLocationClicked}
      handleMapClick={handleMapClick}
      mapCenter={mapCenter}
      initialZoom={initialZoom}
      mapContainerHeight={mapContainerHeight}
      isMobile={isMobile}
      hoveredLocationId={hoveredLocationId}
      handleHover={handleHover}
      handleTouchStart={handleTouchStart}
      handleTouchEnd={handleTouchEnd}
      handleTouchMove={handleTouchMove}
      handleGetLocation={handleGetLocation}
      onLegendToggle={handleLegendToggle}
    />
  );
};

export default PhotoPointsMap;

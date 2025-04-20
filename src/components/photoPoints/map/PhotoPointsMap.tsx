
import React, { useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { usePhotoPointsMapContainer } from '@/hooks/photoPoints/usePhotoPointsMapContainer';
import MapContainer from './MapContainer';

interface PhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onLocationUpdate?: (latitude: number, longitude: number) => void;
}

const PhotoPointsMap: React.FC<PhotoPointsMapProps> = (props) => { 
  const { 
    userLocation,
    locations,
    searchRadius,
    onLocationClick,
    onLocationUpdate
  } = props;
  
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
    searchRadius,
    onLocationClick,
    onLocationUpdate
  });
  
  // Store locations in session storage for persistence
  useEffect(() => {
    if (locations && locations.length > 0) {
      try {
        const simplifiedLocations = locations.map(loc => ({
          id: loc.id || `loc-${loc.latitude?.toFixed(6)}-${loc.longitude?.toFixed(6)}`,
          name: loc.name || 'Unknown Location',
          latitude: loc.latitude,
          longitude: loc.longitude,
          siqs: loc.siqs,
          isDarkSkyReserve: loc.isDarkSkyReserve,
          certification: loc.certification,
          distance: loc.distance
        }));
        
        sessionStorage.setItem('persistent_locations', JSON.stringify(simplifiedLocations));
        console.log(`Stored ${simplifiedLocations.length} locations to session storage`);
      } catch (err) {
        console.error('Error storing locations in session storage:', err);
      }
    }
  }, [locations]);
  
  return (
    <MapContainer
      userLocation={userLocation}
      locations={optimizedLocations}
      searchRadius={searchRadius}
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


import React, { useRef } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { usePhotoPointsMapContainer } from '@/hooks/photoPoints/usePhotoPointsMapContainer';
import MapContainer from './MapContainer';
import './MapStyles.css';

interface PhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  onLocationClick?: (location: SharedAstroSpot) => void;
  onLocationUpdate?: (lat: number, lng: number) => void;
  searchRadius?: number;
  certifiedLocations?: SharedAstroSpot[];
  calculatedLocations?: SharedAstroSpot[];
  activeView?: 'certified' | 'calculated';
}

const PhotoPointsMap: React.FC<PhotoPointsMapProps> = ({
  userLocation,
  locations,
  onLocationClick,
  onLocationUpdate,
  searchRadius = 250,
  certifiedLocations = [],
  calculatedLocations = [],
  activeView = 'calculated'
}) => {
  // Create a stable reference to track mount state
  const isMounted = useRef(true);
  const mapRef = useRef<any>(null);
  
  // Use the custom hook to handle map container functionality
  const {
    mapContainerHeight,
    legendOpen,
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
  
  // Performance enhancement - React.memo the component instance
  React.useEffect(() => {
    // On mount
    console.log("PhotoPointsMap mounted");
    
    // Force re-render after a short delay to ensure map displays correctly
    const timer = setTimeout(() => {
      if (isMounted.current) {
        console.log("Triggering map resize");
        if (mapRef.current && mapRef.current.invalidateSize) {
          mapRef.current.invalidateSize();
        }
      }
    }, 500);
    
    return () => {
      // On unmount
      isMounted.current = false;
      clearTimeout(timer);
      console.log("PhotoPointsMap unmounted");
    };
  }, []);

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

export default React.memo(PhotoPointsMap);

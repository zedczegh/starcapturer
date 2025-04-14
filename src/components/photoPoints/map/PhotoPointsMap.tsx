
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import useMapMarkers from '@/hooks/photoPoints/useMapMarkers';
import { useIsMobile } from '@/hooks/use-mobile';
import LazyMapContainer from './LazyMapContainer';
import { usePhotoPointsMap } from '@/hooks/photoPoints/usePhotoPointsMap';
import PageLoader from '@/components/loaders/PageLoader';
import MobileMapFixer from './MobileMapFixer'; // Import the new component

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

const PhotoPointsMap: React.FC<PhotoPointsMapProps> = ({ 
  userLocation,
  locations,
  certifiedLocations,
  calculatedLocations,
  activeView,
  searchRadius,
  onLocationClick,
  onLocationUpdate
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [mapContainerHeight, setMapContainerHeight] = useState('500px');
  
  // Use the mapping hooks
  const { 
    hoveredLocationId, 
    handleHover,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove
  } = useMapMarkers();
  
  const { 
    mapReady,
    handleMapReady,
    handleLocationClick,
    validLocations,
    mapCenter,
    initialZoom,
    certifiedLocationsLoaded,
    certifiedLocationsLoading
  } = usePhotoPointsMap({
    userLocation,
    locations,
    searchRadius,
    activeView
  });
  
  // Adjust map height based on screen size
  useEffect(() => {
    const adjustHeight = () => {
      if (isMobile) {
        // Use viewport height minus some space for headers on mobile
        setMapContainerHeight(window.innerHeight >= 700 
          ? 'calc(80vh - 160px)'
          : 'calc(90vh - 140px)');
      } else {
        // Desktop height
        setMapContainerHeight('500px');
      }
    };
    
    adjustHeight();
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [isMobile]);
  
  // Handle map click to update location
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onLocationUpdate) {
      onLocationUpdate(lat, lng);
    }
  }, [onLocationUpdate]);
  
  // Handle the location click
  const handleLocationClicked = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    } else {
      handleLocationClick(location);
    }
  }, [onLocationClick, handleLocationClick]);
  
  // Render map with locations
  return (
    <div 
      style={{ height: mapContainerHeight }} 
      className="w-full relative rounded-md overflow-hidden transition-all duration-300"
    >
      {!mapReady && (
        <div className="absolute inset-0 z-20">
          <PageLoader />
        </div>
      )}
      
      {certifiedLocationsLoading && !certifiedLocationsLoaded && (
        <div className="absolute top-4 left-0 right-0 mx-auto w-auto max-w-xs z-30 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-md text-center text-sm text-muted-foreground">
          {t("Loading certified locations...", "正在加载认证地点...")}
        </div>
      )}
      
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
        useMobileMapFixer={true} // Enable the mobile map fixer
      />
    </div>
  );
};

export default PhotoPointsMap;

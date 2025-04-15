
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import useMapMarkers from '@/hooks/photoPoints/useMapMarkers';
import { useIsMobile } from '@/hooks/use-mobile';
import LazyMapContainer from './LazyMapContainer';
import { usePhotoPointsMap } from '@/hooks/photoPoints/usePhotoPointsMap';
import PageLoader from '@/components/loaders/PageLoader';
import MapLegend from './MapLegend';
import CenteringPinpointButton from './CenteringPinpointButton';

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
  
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [mapContainerHeight, setMapContainerHeight] = useState('450px');
  const [legendOpen, setLegendOpen] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  
  const { 
    hoveredLocationId, 
    handleHover,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove
  } = useMapMarkers();
  
  // Use appropriate location set based on active view
  // This ensures we're properly passing the locations to the map
  const locationsToShow = useMemo(() => {
    // For certified view, only show certified locations
    if (activeView === 'certified') {
      return certifiedLocations;
    }
    // For calculated view, show both certified and calculated locations
    return activeView === 'calculated' ? [...certifiedLocations, ...calculatedLocations] : locations;
  }, [activeView, certifiedLocations, calculatedLocations, locations]);
  
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
    locations: locationsToShow, // Use our optimized location selection
    searchRadius,
    activeView
  });
  
  // Filter out some locations on mobile for better performance
  const optimizedLocations = useMemo(() => {
    if (!isMobile) return validLocations;
    
    // For mobile, limit the number of displayed locations
    if (validLocations.length <= 30) return validLocations;
    
    // Always keep certified locations
    const certified = validLocations.filter(loc => 
      loc.isDarkSkyReserve || loc.certification
    );
    
    // For non-certified locations, if we have too many, sample them
    const nonCertified = validLocations
      .filter(loc => !loc.isDarkSkyReserve && !loc.certification)
      .filter((_, index) => index % (activeView === 'certified' ? 4 : 2) === 0)
      .slice(0, 50); // Hard limit for performance
    
    return [...certified, ...nonCertified];
  }, [validLocations, isMobile, activeView]);
  
  useEffect(() => {
    const adjustHeight = () => {
      if (isMobile) {
        setMapContainerHeight('calc(70vh - 200px)');
      } else {
        setMapContainerHeight('450px');
      }
    };
    
    adjustHeight();
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [isMobile]);
  
  // Debounced map click handler to prevent rapid location changes
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onLocationUpdate && !isUpdatingLocation) {
      setIsUpdatingLocation(true);
      console.log("Setting new location from map click:", lat, lng);
      
      // Call the location update and reset the updating state after a delay
      onLocationUpdate(lat, lng);
      
      // Prevent multiple updates in quick succession
      setTimeout(() => {
        setIsUpdatingLocation(false);
      }, 1000);
    }
  }, [onLocationUpdate, isUpdatingLocation]);
  
  const handleLocationClicked = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    } else {
      handleLocationClick(location);
    }
  }, [onLocationClick, handleLocationClick]);
  
  const handleGetLocation = useCallback(() => {
    if (onLocationUpdate && navigator.geolocation && !isUpdatingLocation) {
      setIsUpdatingLocation(true);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onLocationUpdate(latitude, longitude);
          console.log("Got user position:", latitude, longitude);
          
          // Reset updating state after delay
          setTimeout(() => {
            setIsUpdatingLocation(false);
          }, 1000);
        },
        (error) => {
          console.error("Error getting location:", error.message);
          setIsUpdatingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [onLocationUpdate, isUpdatingLocation]);
  
  const handleLegendToggle = useCallback((isOpen: boolean) => {
    setLegendOpen(isOpen);
  }, []);
  
  // Debug log to see what locations are being provided
  useEffect(() => {
    console.log(`PhotoPointsMap - Showing ${optimizedLocations.length} locations (${activeView} view)`);
    console.log(`Certified: ${certifiedLocations.length}, Calculated: ${calculatedLocations.length}`);
  }, [optimizedLocations.length, certifiedLocations.length, calculatedLocations.length, activeView]);

  return (
    <div 
      style={{ height: mapContainerHeight }} 
      className="w-full relative rounded-md overflow-hidden transition-all duration-300 mb-4 mt-2"
    >
      {!mapReady && (
        <div className="absolute inset-0 z-20">
          <PageLoader />
        </div>
      )}
      
      <LazyMapContainer
        center={mapCenter}
        userLocation={userLocation}
        locations={optimizedLocations}
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
        useMobileMapFixer={false} // Disable mobile fixer which causes flashing
        showRadiusCircles={activeView === 'calculated' && !isMobile} // Disable radius circles on mobile
      />
      
      {!isMobile && (
        <MapLegend 
          activeView={activeView} 
          showStarLegend={activeView === 'certified'}
          showCircleLegend={activeView === 'calculated'}
          onToggle={handleLegendToggle}
          className="absolute bottom-4 right-4"
        />
      )}
      
      {!legendOpen && (
        <CenteringPinpointButton 
          onGetLocation={handleGetLocation}
          userLocation={userLocation}
          className={`absolute ${isMobile ? 'bottom-4 right-4' : 'top-4 right-4'}`}
        />
      )}
    </div>
  );
};

export default PhotoPointsMap;

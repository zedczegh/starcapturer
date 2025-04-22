import React, { useEffect } from 'react';
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
  
  useEffect(() => {
    if (locations && locations.length > 0) {
      try {
        const storageKey = activeView === 'certified' ? 
          'persistent_certified_locations' : 
          'persistent_calculated_locations';
        
        const existingData = sessionStorage.getItem(storageKey);
        
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
        
        let combinedLocations = simplifiedLocations;
        
        if (existingData) {
          try {
            const existingLocations = JSON.parse(existingData);
            
            const locationMap = new Map();
            
            if (Array.isArray(existingLocations)) {
              existingLocations.forEach(loc => {
                if (loc && loc.latitude && loc.longitude) {
                  const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
                  locationMap.set(key, loc);
                }
              });
            }
            
            simplifiedLocations.forEach(loc => {
              if (loc && loc.latitude && loc.longitude) {
                const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
                locationMap.set(key, loc);
              }
            });
            
            combinedLocations = Array.from(locationMap.values());
          } catch (err) {
            console.error('Error parsing existing locations:', err);
          }
        }
        
        sessionStorage.setItem(storageKey, JSON.stringify(combinedLocations));
        console.log(`Stored ${combinedLocations.length} ${activeView} locations to session storage`);
      } catch (err) {
        console.error('Error storing locations in session storage:', err);
      }
    }
  }, [locations, activeView]);
  
  useEffect(() => {
    try {
      const storageKey = activeView === 'certified' ? 
        'persistent_certified_locations' : 
        'persistent_calculated_locations';
        
      const storedData = sessionStorage.getItem(storageKey);
      
      if (storedData) {
        console.log(`Found ${storageKey} in session storage, available for fallback`);
      }
    } catch (err) {
      console.error('Error checking session storage:', err);
    }
  }, [activeView]);
  
  console.log(`PhotoPointsMap: optimizedLocations=${optimizedLocations?.length || 0}, mapReady=${mapReady}`);
  
  return (
    <MapContainer
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
      showRadiusCircles={true}
    />
  );
};

export default PhotoPointsMap;


import React, { useEffect, useMemo } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { usePhotoPointsMapContainer } from '@/hooks/photoPoints/usePhotoPointsMapContainer';
import MapContainer from './MapContainer';
import { LocationListFilter } from '../ViewToggle';
import { getAllCertifiedLocations } from '@/services/certifiedLocationsService';

interface PhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onLocationUpdate?: (latitude: number, longitude: number) => void;
  activeFilter: LocationListFilter;
}

const PhotoPointsMap: React.FC<PhotoPointsMapProps> = (props) => { 
  const { 
    userLocation,
    locations,
    searchRadius,
    onLocationClick,
    onLocationUpdate,
    activeFilter
  } = props;
  
  // Get all available certified locations from the service
  const allCertifiedLocations = useMemo(() => getAllCertifiedLocations(), []);
  
  // Combine passed locations with all certified locations when needed
  const combinedLocations = useMemo(() => {
    // For certified or all filters, ensure we include all certified locations
    if (activeFilter === 'certified' || activeFilter === 'all') {
      // Create a map to avoid duplicates
      const locationMap = new Map<string, SharedAstroSpot>();
      
      // Add passed locations first
      locations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locationMap.set(key, loc);
        }
      });
      
      // Then add all certified locations
      allCertifiedLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locationMap.set(key, loc);
        }
      });
      
      console.log(`PhotoPointsMap: Combined ${locations.length} passed locations with ${allCertifiedLocations.length} certified locations for a total of ${locationMap.size} unique locations`);
      return Array.from(locationMap.values());
    } 
    
    // For calculated filter, just use the passed locations
    return locations;
  }, [locations, allCertifiedLocations, activeFilter]);
  
  // Split locations into certified and calculated for the hook
  const certifiedLocations = useMemo(() => 
    combinedLocations.filter(loc => loc.isDarkSkyReserve || loc.certification),
    [combinedLocations]
  );
  
  const calculatedLocations = useMemo(() => 
    combinedLocations.filter(loc => !loc.isDarkSkyReserve && !loc.certification),
    [combinedLocations]
  );
  
  // Log the counts for debugging
  useEffect(() => {
    console.log(`PhotoPointsMap: Using ${combinedLocations.length} total locations (${certifiedLocations.length} certified, ${calculatedLocations.length} calculated)`);
  }, [combinedLocations.length, certifiedLocations.length, calculatedLocations.length]);
  
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
    locations: combinedLocations,
    certifiedLocations,
    calculatedLocations,
    activeFilter,
    searchRadius,
    onLocationClick,
    onLocationUpdate,
    activeView: activeFilter === 'calculated' ? 'calculated' : 'certified'
  });
  
  // Store locations in session storage for persistence
  useEffect(() => {
    if (combinedLocations && combinedLocations.length > 0) {
      try {
        const simplifiedLocations = combinedLocations.map(loc => ({
          id: loc.id || `loc-${loc.latitude?.toFixed(6)}-${loc.longitude?.toFixed(6)}`,
          name: loc.name || 'Unknown Location',
          latitude: loc.latitude,
          longitude: loc.longitude,
          siqs: loc.siqs,
          isDarkSkyReserve: loc.isDarkSkyReserve,
          certification: loc.certification,
          distance: loc.distance,
          type: loc.type
        }));
        
        sessionStorage.setItem('persistent_locations', JSON.stringify(simplifiedLocations));
        console.log(`Stored ${simplifiedLocations.length} locations to session storage`);
        
        // Store certified locations separately for better access
        const certifiedOnly = simplifiedLocations.filter(loc => 
          loc.isDarkSkyReserve || loc.certification
        );
        
        if (certifiedOnly.length > 0) {
          sessionStorage.setItem('persistent_certified_locations', JSON.stringify(certifiedOnly));
          console.log(`Stored ${certifiedOnly.length} certified locations to session storage`);
        }
      } catch (err) {
        console.error('Error storing locations in session storage:', err);
      }
    }
  }, [combinedLocations]);
  
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
      activeView={activeFilter === 'calculated' ? 'calculated' : 'certified'}
      activeFilter={activeFilter}
    />
  );
};

export default PhotoPointsMap;

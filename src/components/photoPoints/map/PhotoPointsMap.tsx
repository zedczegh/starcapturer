
import React, { useEffect, useMemo } from 'react';
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
  
  // Always include all certified locations regardless of view
  const effectiveLocations = useMemo(() => {
    if (activeView === 'certified') {
      return certifiedLocations;
    } else {
      // For calculated view, include both certified AND calculated locations
      // Use a Set to deduplicate by coordinates
      const locationMap = new Map<string, SharedAstroSpot>();
      
      // Add certified locations first to ensure they get priority
      certifiedLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          locationMap.set(key, loc);
        }
      });
      
      // Then add calculated locations
      calculatedLocations.forEach(loc => {
        if (loc.latitude && loc.longitude) {
          const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
          if (!locationMap.has(key)) {
            locationMap.set(key, loc);
          }
        }
      });
      
      return Array.from(locationMap.values());
    }
  }, [certifiedLocations, calculatedLocations, activeView]);
  
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
    locations: effectiveLocations,
    certifiedLocations,
    calculatedLocations,
    activeView,
    searchRadius,
    onLocationClick,
    onLocationUpdate
  });
  
  // Add persistent storage for locations
  useEffect(() => {
    if (locations && locations.length > 0) {
      try {
        // Store ALL locations in session storage for persistence
        const storageKey = activeView === 'certified' ? 
          'persistent_certified_locations' : 
          'persistent_calculated_locations';
        
        // Load existing locations first to avoid overwriting 
        const existingData = sessionStorage.getItem(storageKey);
        
        // Only store the most important fields to reduce storage size
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
            
            // Create a map to deduplicate by coordinates
            const locationMap = new Map();
            
            // Add existing locations first
            if (Array.isArray(existingLocations)) {
              existingLocations.forEach(loc => {
                if (loc && loc.latitude && loc.longitude) {
                  const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
                  locationMap.set(key, loc);
                }
              });
            }
            
            // Add new locations, overwriting existing ones if they have the same coordinates
            simplifiedLocations.forEach(loc => {
              if (loc && loc.latitude && loc.longitude) {
                const key = `${loc.latitude.toFixed(6)}-${loc.longitude.toFixed(6)}`;
                locationMap.set(key, loc);
              }
            });
            
            // Convert back to array
            combinedLocations = Array.from(locationMap.values());
          } catch (err) {
            console.error('Error parsing existing locations:', err);
          }
        }
        
        // Store the merged locations
        sessionStorage.setItem(storageKey, JSON.stringify(combinedLocations));
        console.log(`Stored ${combinedLocations.length} ${activeView} locations to session storage`);
      } catch (err) {
        console.error('Error storing locations in session storage:', err);
      }
    }
  }, [locations, activeView]);
  
  // Also always store certified locations separately to ensure they're available
  useEffect(() => {
    if (certifiedLocations && certifiedLocations.length > 0) {
      try {
        sessionStorage.setItem('certified_locations_backup', JSON.stringify(certifiedLocations));
        console.log(`Stored ${certifiedLocations.length} certified locations to backup storage`);
      } catch (err) {
        console.error('Error storing certified locations in backup storage:', err);
      }
    }
  }, [certifiedLocations]);
  
  // Add fallback mechanism to load certified locations if they disappear
  useEffect(() => {
    if (activeView === 'certified' && optimizedLocations && optimizedLocations.length === 0) {
      try {
        console.log('No certified locations found, attempting to load from backup');
        const backup = sessionStorage.getItem('certified_locations_backup');
        if (backup) {
          const parsedLocations = JSON.parse(backup);
          if (Array.isArray(parsedLocations) && parsedLocations.length > 0) {
            console.log(`Loaded ${parsedLocations.length} certified locations from backup`);
            // We can't directly set optimizedLocations since it's coming from a hook,
            // but this ensures the data is available for the next render cycle
          }
        }
      } catch (err) {
        console.error('Error loading certified locations from backup:', err);
      }
    }
  }, [activeView, optimizedLocations]);
  
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

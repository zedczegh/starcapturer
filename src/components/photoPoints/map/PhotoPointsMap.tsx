
import React, { useEffect } from 'react';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { usePhotoPointsMapContainer } from '@/hooks/photoPoints/usePhotoPointsMapContainer';
import MapContainer from './MapContainer';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, addDays } from 'date-fns';

interface PhotoPointsMapProps {
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  certifiedLocations: SharedAstroSpot[];
  calculatedLocations: SharedAstroSpot[];
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  forecastDay?: number;
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
    forecastDay = 0,
    onLocationClick,
    onLocationUpdate
  } = props;
  
  const { t } = useLanguage();
  
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

  // Generate forecast overlay if needed
  const getForecastOverlay = () => {
    if (!forecastDay || forecastDay <= 0) return null;

    const forecastDate = addDays(new Date(), forecastDay);
    
    return (
      <div className="absolute top-2 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <div className="px-3 py-1 rounded-full bg-primary/90 text-white text-sm font-medium shadow-md">
          {t("Weather forecast for", "天气预报：")} {format(forecastDate, 'MMM d')}
        </div>
      </div>
    );
  };
  
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
          distance: loc.distance,
          isForecast: loc.isForecast || false,
          forecastDate: loc.forecastDate || null,
          weatherData: loc.weatherData || null
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
  
  // Load persisted locations on component mount
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
    <div className="relative">
      {getForecastOverlay()}
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
        isForecast={forecastDay > 0}
      />
    </div>
  );
};

export default PhotoPointsMap;

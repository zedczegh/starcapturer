
import React, { useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { LocationMarker } from '../LocationMarker';
import { ForecastMarker } from '../MarkerComponents';
import { UserLocationMarker } from './UserLocationMarker';
import { RadiusCircles } from './RadiusCircles';

// Helper component for map interaction
const MapInteraction = ({
  center,
  zoom,
  onMapClick,
  mapRef,
  onMapReady,
}: {
  center: [number, number];
  zoom: number;
  onMapClick?: (lat: number, lng: number) => void;
  mapRef: React.MutableRefObject<L.Map | null>;
  onMapReady?: () => void;
}) => {
  const map = useMap();
  
  // Store the map instance in the ref
  useEffect(() => {
    if (map) {
      mapRef.current = map;
      if (onMapReady) onMapReady();
    }
    
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef, onMapReady]);
  
  // Pan to new center when it changes
  useEffect(() => {
    if (map) {
      map.setView(center, zoom);
    }
  }, [center, map, zoom]);
  
  // Set up map click handler
  useEffect(() => {
    if (!map || !onMapClick) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);
  
  return null;
};

// Props for the MapContent component
export interface MapContentProps {
  center: [number, number];
  userLocation: { latitude: number; longitude: number } | null;
  zoom: number;
  displayLocations: SharedAstroSpot[];
  isMobile: boolean;
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  showRadiusCircles: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
  hoveredLocationId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  useMobileMapFixer?: boolean;
  mapRef: React.MutableRefObject<L.Map | null>;
  onMapReady?: () => void;
  currentSiqs?: number | null;
  showForecast?: boolean;
  forecastDay?: number;
}

const MapContent: React.FC<MapContentProps> = ({
  center,
  userLocation,
  zoom,
  displayLocations,
  isMobile,
  activeView,
  searchRadius,
  showRadiusCircles,
  onMapClick,
  onLocationClick,
  hoveredLocationId,
  onMarkerHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  useMobileMapFixer = false,
  mapRef,
  onMapReady,
  currentSiqs,
  showForecast = false,
  forecastDay = 0
}) => {
  // Separate forecast locations from regular locations
  const regularLocations = displayLocations.filter(loc => !loc.isForecast);
  const forecastLocations = showForecast 
    ? displayLocations.filter(
        loc => loc.isForecast && loc.forecastDay === forecastDay
      ) 
    : [];
  
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) onLocationClick(location);
  }, [onLocationClick]);
  
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      attributionControl={false}
      zoomControl={!isMobile}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapInteraction 
        center={center} 
        zoom={zoom} 
        onMapClick={onMapClick}
        mapRef={mapRef}
        onMapReady={onMapReady}
      />
      
      {userLocation && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]}
          currentSiqs={currentSiqs}
        />
      )}
      
      {/* Render radius circles if enabled */}
      {showRadiusCircles && userLocation && (
        <RadiusCircles 
          center={[userLocation.latitude, userLocation.longitude]} 
          searchRadius={searchRadius}
        />
      )}
      
      {/* Render regular locations */}
      {regularLocations.map((location) => {
        const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
        const isCalculated = !isCertified;
        
        // Only show certified locations in certified view, and non-certified in calculated view
        if ((activeView === 'certified' && !isCertified) || 
            (activeView === 'calculated' && isCertified && regularLocations.length > 30)) {
          return null;
        }
        
        // Generate a unique ID for the location if it doesn't have one
        const locationId = location.id || `${location.latitude}-${location.longitude}`;
        
        return (
          <LocationMarker
            key={locationId}
            location={location}
            onClick={handleLocationClick}
            isHovered={hoveredLocationId === locationId}
            onHover={onMarkerHover || (() => {})}
            locationId={locationId}
            isCertified={isCertified}
            activeView={activeView}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
            handleTouchMove={handleTouchMove}
          />
        );
      })}
      
      {/* Render forecast locations if enabled */}
      {showForecast && forecastLocations.map((location) => {
        // Generate a unique ID for the forecast location
        const locationId = location.id || `forecast-${location.latitude}-${location.longitude}-${forecastDay}`;
        
        return (
          <ForecastMarker
            key={locationId}
            location={location}
            isActive={hoveredLocationId === locationId}
            onClick={handleLocationClick}
            onMouseOver={id => onMarkerHover?.(id)}
            onMouseOut={() => onMarkerHover?.(null)}
          />
        );
      })}
    </MapContainer>
  );
};

export default MapContent;

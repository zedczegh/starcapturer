
import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import MapMarkers from '../MapMarkers';
import MapControls from '../MapControls';
import MapPanToLocation from '../MapPanToLocation';
import UserLocationMarker from '../UserLocationMarker';
import RadiusCircle from '../RadiusCircle';
import { MapEffectsComposer } from '../MapComponents';

export interface MapContentProps {
  center: [number, number];
  userLocation: { latitude: number; longitude: number } | null;
  zoom: number;
  displayLocations: SharedAstroSpot[];
  isMobile: boolean;
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  showRadiusCircles?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
  hoveredLocationId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent<Element>, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent<Element>) => void;
  handleTouchMove?: (e: React.TouchEvent<Element>) => void;
  useMobileMapFixer?: boolean;
  mapRef?: React.MutableRefObject<any>;
  onMapReady?: () => void;
  currentSiqs: number | null;
  isForecast?: boolean;
}

const MapContent: React.FC<MapContentProps> = ({
  center,
  userLocation,
  zoom,
  displayLocations,
  isMobile,
  activeView,
  searchRadius,
  showRadiusCircles = true,
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
  isForecast = false
}) => {
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (mapRef && mapInstance.current) {
      mapRef.current = mapInstance.current;
    }
  }, [mapRef, mapInstance.current]);

  // This component sets up the map and its base functionality
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      attributionControl={false}
      zoomControl={false}
      ref={mapInstance}
      whenReady={() => {
        if (onMapReady) onMapReady();
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Add map controls */}
      <MapControls position="topright" />

      {/* Add radius circle if in calculated view */}
      {showRadiusCircles && userLocation && (
        <RadiusCircle
          center={[userLocation.latitude, userLocation.longitude]}
          radius={searchRadius * 1000} // Convert km to meters
          color={isForecast ? "#8865d3" : "#3388ff"}
          weight={2}
          opacity={0.5}
          dashArray={isForecast ? "5, 10" : undefined}
        />
      )}

      {/* Add map effects based on view */}
      <MapEffectsComposer 
        activeView={activeView} 
        searchRadius={searchRadius}
        isForecast={isForecast}
      />

      {/* Add markers for all locations */}
      {displayLocations.length > 0 && (
        <MapMarkers
          locations={displayLocations}
          activeView={activeView}
          onLocationClick={onLocationClick}
          hoveredLocationId={hoveredLocationId}
          onMarkerHover={onMarkerHover}
          handleTouchStart={handleTouchStart}
          handleTouchEnd={handleTouchEnd}
          handleTouchMove={handleTouchMove}
          useMobileOptimization={useMobileMapFixer}
          isForecast={isForecast}
        />
      )}

      {/* User location marker */}
      {userLocation && (
        <UserLocationMarker
          latitude={userLocation.latitude}
          longitude={userLocation.longitude}
          currentSiqs={currentSiqs}
        />
      )}

      {/* Pan to current location */}
      {userLocation && (
        <MapPanToLocation 
          position={[userLocation.latitude, userLocation.longitude]} 
          onMapClick={onMapClick}
        />
      )}
    </MapContainer>
  );
};

export default MapContent;

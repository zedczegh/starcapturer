
import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, AttributionControl } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { LocationMarker } from '../MarkerComponents';
import UserLocationMarker from './UserLocationMarker';
import SearchRadiusCircles from './SearchRadiusCircles';
import { MapEffectsComposer } from '../effects/MapEffectsComposer';

// MapEvents component to handle map clicks
const MapEvents = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  const map = useMapEvents({
    click: (event: LeafletMouseEvent) => {
      const { lat, lng } = event.latlng;
      onMapClick(lat, lng);
    }
  });
  return null;
};

interface MapContentProps {
  center: [number, number];
  zoom: number;
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  isMapReady: boolean;
  onMapReady: () => void;
  onLocationClick: (location: SharedAstroSpot) => void;
  onMapClick: (lat: number, lng: number) => void;
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  hoveredLocationId: string | null;
  onMarkerHover: (id: string | null) => void;
  handleTouchStart: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  isMobile: boolean;
  useMobileMapFixer: boolean;
  showRadiusCircles: boolean;
  isForecastMode?: boolean;
  selectedForecastDay?: number;
}

const MapContent: React.FC<MapContentProps> = ({
  center,
  zoom,
  userLocation,
  locations,
  isMapReady,
  onMapReady,
  onLocationClick,
  onMapClick,
  searchRadius,
  activeView,
  hoveredLocationId,
  onMarkerHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  isMobile,
  useMobileMapFixer,
  showRadiusCircles,
  isForecastMode = false,
  selectedForecastDay = 0
}) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) {
      onMapReady();
    }
  }, [onMapReady]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
      attributionControl={false}
    >
      <AttributionControl position="bottomright" prefix={false} />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Map Click Events Handler */}
      <MapEvents onMapClick={onMapClick} />
      
      {/* User Location Marker */}
      {userLocation && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]} 
          onLocationUpdate={(lat, lng) => onMapClick(lat, lng)}
        />
      )}
      
      {/* Search Radius Circle */}
      {showRadiusCircles && userLocation && (
        <SearchRadiusCircles 
          center={[userLocation.latitude, userLocation.longitude]} 
          radius={searchRadius}
        />
      )}
      
      {/* Location Markers */}
      {locations.map(location => (
        <LocationMarker
          key={location.id}
          location={location}
          onClick={onLocationClick}
          isHovered={location.id === hoveredLocationId}
          onHover={onMarkerHover}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          isMobile={isMobile}
        />
      ))}
      
      {/* Map Effects */}
      <MapEffectsComposer
        showRadiusCircles={showRadiusCircles}
        userLocation={userLocation}
        activeView={activeView}
        isForecastMode={isForecastMode}
        selectedForecastDay={selectedForecastDay}
      />
    </MapContainer>
  );
};

export default MapContent;

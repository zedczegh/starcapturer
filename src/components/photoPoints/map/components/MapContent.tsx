
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import LocationMarker from '../MarkerComponents';
import { MapEffectsComposer } from '../MapComponents';
import UserLocationMarker from './UserLocationMarker';
import SearchRadiusCircles from './SearchRadiusCircles';

// Map Event Handler Component
const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  const map = useMap();
  
  useEffect(() => {
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

interface MapContentProps {
  center: [number, number];
  zoom: number;
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  isMapReady: boolean;
  onMapReady: () => void;
  onLocationClick: (location: SharedAstroSpot) => void;
  onMapClick: (lat: number, lng: number) => void;
  hoveredLocationId: string | null;
  onMarkerHover: (id: string | null) => void;
  handleTouchStart: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd: (e: React.TouchEvent, id: string | null) => void;
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
  searchRadius,
  activeView,
  isMapReady,
  onMapReady,
  onLocationClick,
  onMapClick,
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
  useEffect(() => {
    if (center && center[0] && center[1]) {
      onMapReady();
    }
  }, [center, onMapReady]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
      attributionControl={false}
      zoomControl={false}
      scrollWheelZoom={true}
      doubleClickZoom={true}
      touchZoom={true}
      dragging={true}
      whenReady={onMapReady}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <ZoomControl position="bottomright" />
      
      <MapClickHandler onMapClick={onMapClick} />
      
      {userLocation && (
        <>
          <UserLocationMarker 
            userLocation={[userLocation.latitude, userLocation.longitude]} 
            onClick={() => console.log('User location clicked')}
          />
          
          {showRadiusCircles && (
            <SearchRadiusCircles 
              center={[userLocation.latitude, userLocation.longitude]} 
              radius={searchRadius} 
            />
          )}
        </>
      )}
      
      {locations.map((location) => (
        <LocationMarker
          key={location.id || `${location.latitude}-${location.longitude}`}
          location={location}
          onClick={onLocationClick}
          isHovered={hoveredLocationId === location.id}
          onHover={onMarkerHover}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          isMobile={isMobile}
        />
      ))}
      
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

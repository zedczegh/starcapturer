
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import LocationMarker from '../LocationMarker';
import { UserLocationMarker, ForecastMarker } from '../MarkerComponents';
import L from 'leaflet';

export interface MapContentProps {
  center: [number, number];
  zoom?: number;
  userLocation: { latitude: number; longitude: number } | null;
  displayLocations: SharedAstroSpot[];
  isMobile: boolean;
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  showRadiusCircles?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
  hoveredLocationId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  useMobileMapFixer?: boolean;
  mapRef: React.RefObject<L.Map>;
  onMapReady?: () => void;
  currentSiqs?: number | null;
  showForecast?: boolean;
  forecastDay?: number;
}

// Helper component to handle map events
const MapEvents = ({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!onMapClick) return;
    
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

const MapContent: React.FC<MapContentProps> = ({
  center,
  zoom = 10,
  userLocation,
  displayLocations,
  isMobile,
  activeView,
  searchRadius,
  showRadiusCircles = false,
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

  // Set up map when component mounts
  useEffect(() => {
    if (onMapReady) {
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
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Show search radius circle */}
      {userLocation && showRadiusCircles && (
        <Circle 
          center={[userLocation.latitude, userLocation.longitude]} 
          radius={searchRadius * 1000} // Convert km to meters
          pathOptions={{ 
            color: 'rgba(66, 133, 244, 0.6)',
            weight: 1,
            fillOpacity: 0.05
          }} 
        />
      )}
      
      {/* User's current location marker */}
      {userLocation && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]}
          onClick={() => console.log('Current location clicked')}
        />
      )}
      
      {/* Regular location markers */}
      {displayLocations.filter(location => !location.isForecast).map(location => (
        <LocationMarker 
          key={`${location.latitude}-${location.longitude}`}
          location={location}
          onClick={onLocationClick ? (loc) => onLocationClick(loc) : () => {}}
          isHovered={hoveredLocationId === location.id}
          onHover={onMarkerHover ? (id) => onMarkerHover(id) : () => {}}
          locationId={location.id || `loc-${location.latitude}-${location.longitude}`}
          isCertified={Boolean(location.isDarkSkyReserve || location.certification)}
          activeView={activeView}
          handleTouchStart={handleTouchStart}
          handleTouchEnd={handleTouchEnd}
          handleTouchMove={handleTouchMove}
        />
      ))}
      
      {/* Forecast location markers */}
      {showForecast && displayLocations.filter(location => location.isForecast && location.forecastDay === forecastDay).map(location => (
        <ForecastMarker 
          key={`forecast-${location.latitude}-${location.longitude}`}
          location={location}
          onClick={onLocationClick ? (loc) => onLocationClick(loc) : () => {}}
          onMouseOver={onMarkerHover ? (id) => onMarkerHover(id) : () => {}}
          onMouseOut={onMarkerHover ? () => onMarkerHover(null) : () => {}}
          isActive={hoveredLocationId === location.id}
        />
      ))}
      
      {/* Map event handlers */}
      {onMapClick && <MapEvents onMapClick={onMapClick} />}
    </MapContainer>
  );
};

export default React.memo(MapContent);

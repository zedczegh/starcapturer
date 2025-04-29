
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, ZoomControl as LeafletZoomControl, useMap } from 'react-leaflet';
import { SharedAstroSpot } from '@/types/weather';
import LocationMarker from '../LocationMarker';
import SearchRadiusCircles from './SearchRadiusCircles';
import UserLocationMarker from './UserLocationMarker';
import { MapEffectsComposer } from '../effects/MapEffectsComposer';

interface MapContentProps {
  center: [number, number];
  zoom: number;
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onMarkerHover: (id: string | null) => void;
  hoveredLocationId: string | null;
  handleTouchStart: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  isMobile: boolean;
  showRadiusCircles?: boolean;
  onLocationClick: (location: SharedAstroSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  isForecastMode?: boolean;
  selectedForecastDay?: number;
}

interface MapClickHandlerProps {
  handleClick: (lat: number, lng: number) => void;
}

// Component to handle map clicks
const MapClickHandler: React.FC<MapClickHandlerProps> = ({ handleClick }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const onClick = (e: any) => {
      const { lat, lng } = e.latlng;
      handleClick(lat, lng);
    };

    map.on('click', onClick);

    return () => {
      map.off('click', onClick);
    };
  }, [map, handleClick]);

  return null;
};

const MapContent: React.FC<MapContentProps> = ({
  center,
  zoom,
  userLocation,
  locations,
  searchRadius,
  activeView,
  onMarkerHover,
  hoveredLocationId,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  isMobile,
  showRadiusCircles = false,
  onLocationClick,
  onMapClick,
  isForecastMode = false,
  selectedForecastDay = 0
}) => {
  const mapRef = useRef(null);

  // Store the map instance in window for external access
  useEffect(() => {
    if (mapRef.current) {
      (window as any).leafletMap = mapRef.current;
    }
    
    return () => {
      delete (window as any).leafletMap;
    };
  }, [mapRef]);
  
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
      attributionControl={false}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Use Leaflet's built-in ZoomControl */}
      <LeafletZoomControl position="bottomright" />
      
      {/* Add custom map click handler */}
      {onMapClick && <MapClickHandler handleClick={onMapClick} />}
      
      {/* Show markers for each location */}
      {locations.map(location => {
        // Skip invalid locations
        if (!location?.latitude || !location?.longitude) return null;
        
        // Generate a unique ID for the location
        const locationId = location.id || `${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
        const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
        
        return (
          <LocationMarker
            key={locationId}
            location={location}
            onClick={onLocationClick}
            isHovered={hoveredLocationId === locationId}
            onHover={onMarkerHover}
            locationId={locationId}
            isCertified={isCertified}
            activeView={activeView}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
            handleTouchMove={handleTouchMove}
          />
        );
      })}
      
      {/* Show user location marker if available */}
      {userLocation && (
        <UserLocationMarker
          position={[userLocation.latitude, userLocation.longitude]}
        />
      )}
      
      {/* Show search radius circles if requested and user location is available */}
      {showRadiusCircles && userLocation && (
        <SearchRadiusCircles
          center={[userLocation.latitude, userLocation.longitude]}
          radius={searchRadius}
        />
      )}
      
      {/* Add map effects composer for additional visual elements */}
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

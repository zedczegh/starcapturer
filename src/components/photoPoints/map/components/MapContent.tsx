
import React from 'react';
import { MapContainer, TileLayer, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import { SharedAstroSpot } from '@/types/weather';
import { LocationMarkerComponent, UserMarkerComponent } from '../MarkerComponents';
import SearchRadiusCircles from './SearchRadiusCircles';
import { MapEffectsComposer } from './MapEffectsComposer';
import { useMarkerState } from '@/hooks/photoPoints/useMarkerState';
import 'leaflet/dist/leaflet.css';
import '../MapStyles.css';

interface MapContentProps {
  center: [number, number];
  userLocation: { latitude: number; longitude: number } | null;
  zoom: number;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onLocationClick: (location: SharedAstroSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  hoveredLocationId: string | null;
  onMarkerHover: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  isMobile: boolean;
  isForecastMode?: boolean;
  selectedForecastDay?: number;
}

const MapContent: React.FC<MapContentProps> = ({
  center,
  userLocation,
  zoom,
  locations,
  searchRadius,
  activeView,
  onLocationClick,
  onMapClick,
  hoveredLocationId,
  onMarkerHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  isMobile,
  isForecastMode = false,
  selectedForecastDay = 0
}) => {
  // Create a user marker icon
  const userMarkerIcon = React.useMemo(() => {
    return L.icon({
      iconUrl: '/marker-icon.png',
      shadowUrl: '/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }, []);
  
  // Map click handler for updating the search location
  const handleMapClickEvent = React.useCallback((e: any) => {
    if (onMapClick) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  }, [onMapClick]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      zoomControl={false}
      className="w-full h-full"
      style={{ background: '#010e1a' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      
      <ScaleControl position="bottomleft" />
      
      {/* Render locations as markers */}
      {locations.map(location => {
        const isCertified = !!location.certification || location.isCertified;
        const isHovered = hoveredLocationId === location.id;
        
        const { icon, siqsScore, displayName } = useMarkerState({
          location,
          realTimeSiqs: null, // Will be calculated in LocationMarker
          isCertified,
          isHovered
        });
        
        return (
          <LocationMarkerComponent
            key={location.id || `${location.latitude}-${location.longitude}`}
            location={location}
            realTimeSiqs={null}
            isUserMarker={false}
            isCertified={isCertified}
            icon={icon}
            isHovered={isHovered}
            onMarkerClick={onLocationClick}
            onMarkerHover={onMarkerHover}
            isMobile={isMobile}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
            displayName={displayName}
            siqsScore={siqsScore}
          />
        );
      })}
      
      {/* Render user location marker */}
      {userLocation && (
        <UserMarkerComponent
          position={[userLocation.latitude, userLocation.longitude]}
          icon={userMarkerIcon}
        />
      )}
      
      {/* Render search radius circles */}
      {userLocation && (
        <SearchRadiusCircles
          userLocation={userLocation}
          searchRadius={searchRadius}
          activeView={activeView}
          isForecastMode={isForecastMode}
        />
      )}
      
      {/* Map effects composer */}
      <MapEffectsComposer
        showRadiusCircles={true}
        userLocation={userLocation}
        activeView={activeView}
        isForecastMode={isForecastMode}
        onMapClick={handleMapClickEvent}
      />
    </MapContainer>
  );
};

export default MapContent;

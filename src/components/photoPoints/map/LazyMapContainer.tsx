
import React, { useCallback } from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MarkerStyles.css';
import './MapStyles.css';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { LocationMarker } from './markers/LocationMarker';
import { UserLocationMarker } from './markers/UserLocationMarker';
import useMapEffects from '@/hooks/photoPoints/map/useMapEffects';
import useMapEvents from '@/hooks/photoPoints/map/useMapEvents';
import MapController from './MapController';
import MapLegend from './MapLegend';
import MobileMapFixer from './MobileMapFixer';
import { configureLeaflet } from '@/components/location/map/MapMarkerUtils';
import { MapEffectsComposer } from './MapComponents';

// Configure Leaflet before any map component renders
configureLeaflet();

interface LazyMapContainerProps {
  center: [number, number];
  userLocation: { latitude: number; longitude: number } | null;
  locations: SharedAstroSpot[];
  searchRadius: number;
  activeView: 'certified' | 'calculated';
  onMapReady?: () => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
  onMapClick?: (lat: number, lng: number) => void;
  zoom?: number;
  hoveredLocationId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  isMobile?: boolean;
  useMobileMapFixer?: boolean;
  showRadiusCircles?: boolean;
}

const LazyMapContainer: React.FC<LazyMapContainerProps> = ({
  center,
  userLocation,
  locations,
  searchRadius,
  activeView,
  onMapReady,
  onLocationClick,
  onMapClick,
  zoom = 10,
  hoveredLocationId,
  onMarkerHover,
  isMobile = false,
  useMobileMapFixer = false,
  showRadiusCircles = false
}) => {
  const handleMapReady = useCallback(() => {
    if (onMapReady) onMapReady();
  }, [onMapReady]);

  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) onLocationClick(location);
  }, [onLocationClick]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
      className={`map-container ${isMobile ? 'mobile-optimized' : ''}`}
      whenReady={handleMapReady}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {useMapEffects(searchRadius, userLocation)}
      
      {showRadiusCircles && userLocation && (
        <Circle
          center={[userLocation.latitude, userLocation.longitude]}
          pathOptions={{
            color: 'rgb(99, 102, 241)',
            fillColor: 'rgb(99, 102, 241)',
            fillOpacity: 0.05,
            weight: 1,
            dashArray: '5, 5',
          }}
          radius={searchRadius * 1000}
        />
      )}
      
      <MapEffectsComposer 
        center={center}
        zoom={zoom}
        userLocation={userLocation}
        activeView={activeView}
        searchRadius={searchRadius}
      />
      
      {locations.map(location => {
        if (!location.latitude || !location.longitude) return null;
        
        const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
        const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
        
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
          />
        );
      })}
      
      {userLocation && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]} 
        />
      )}
      
      <MapController 
        userLocation={userLocation} 
        searchRadius={searchRadius}
      />
      
      {useMobileMapFixer && isMobile && <MobileMapFixer />}
    </MapContainer>
  );
};

export default LazyMapContainer;

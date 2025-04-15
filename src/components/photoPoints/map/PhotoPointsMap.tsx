
import React, { useCallback, useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MarkerStyles.css';
import './MapStyles.css';
import { LocationMarker, UserLocationMarker } from './MarkerComponents';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { configureLeaflet } from '@/components/location/map/MapMarkerUtils';
import MapController from './MapController';
import MapLegend from './MapLegend';
import MobileMapFixer from './MobileMapFixer';
import { MapEffectsComposer } from './MapComponents';

configureLeaflet();

interface PhotoPointsMapProps {
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
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  isMobile?: boolean;
  useMobileMapFixer?: boolean;
  showRadiusCircles?: boolean;
}

const PhotoPointsMap: React.FC<PhotoPointsMapProps> = ({
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
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  isMobile,
  useMobileMapFixer = false,
  showRadiusCircles = false
}) => {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<any>(null);
  
  const stableOnLocationClick = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick]);

  const stableOnMapClick = useCallback((lat: number, lng: number) => {
    if (onMapClick) {
      onMapClick(lat, lng);
    }
  }, [onMapClick]);

  const handleMapReady = useCallback(() => {
    setMapReady(true);
    if (onMapReady) {
      onMapReady();
    }
  }, [onMapReady]);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        ref={mapRef}
        className={`map-container ${isMobile ? 'mobile-optimized' : ''}`}
        whenReady={handleMapReady}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
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

        {userLocation && (
          <UserLocationMarker 
            position={[userLocation.latitude, userLocation.longitude]}
            currentSiqs={null}
          />
        )}
        
        {locations.map(location => {
          if (!location.latitude || !location.longitude) return null;
          
          const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
          const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
          const isHovered = hoveredLocationId === locationId;
          
          return (
            <LocationMarker
              key={locationId}
              location={location}
              onClick={stableOnLocationClick}
              isHovered={isHovered}
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
        
        <MapController 
          userLocation={userLocation} 
          searchRadius={searchRadius}
        />
        
        {useMobileMapFixer && isMobile && <MobileMapFixer />}
      </MapContainer>
    </div>
  );
};

export default PhotoPointsMap;

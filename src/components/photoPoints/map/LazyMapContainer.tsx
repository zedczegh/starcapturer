
import React, { useCallback, useState, useRef } from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MarkerStyles.css';
import './MapStyles.css';
import { LocationMarker, UserLocationMarker } from './MarkerComponents';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { configureLeaflet } from '@/components/location/map/MapMarkerUtils';
import MapController from './MapController';
import MobileMapFixer from './MobileMapFixer';
import { MapEvents } from './MapEffectsController';
import { MapEffectsComposer } from './MapComponents';
import { getLocationId } from './markers/MarkerUtils';
import { MapResizeHandler, SiqsDetector, MapInitializer } from './MapHandlers';

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
  isMobile?: boolean;
  useMobileMapFixer?: boolean;
  showRadiusCircles?: boolean;
  onMarkerHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
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
  isMobile,
  useMobileMapFixer = false,
  showRadiusCircles = false,
  onMarkerHover,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const handleMapReady = useCallback(() => {
    setMapReady(true);
    if (onMapReady) {
      onMapReady();
    }
  }, [onMapReady]);
  
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick]);
  
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (onMapClick) {
      onMapClick(lat, lng);
      console.log("Map clicked, updating location to:", lat, lng);
    }
  }, [onMapClick]);
  
  return (
    <div ref={mapContainerRef} className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        ref={mapRef}
        className={`map-container ${isMobile ? 'mobile-optimized' : ''}`}
        whenReady={handleMapReady}
        attributionControl={true}
        key={`map-${center[0]}-${center[1]}-${searchRadius}`}
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
        
        <MapEffectsComposer 
          center={center}
          zoom={zoom}
          userLocation={userLocation}
          activeView={activeView}
          searchRadius={searchRadius}
          onSiqsCalculated={(siqs) => setCurrentSiqs(siqs)}
        />
        
        <MapEvents onMapClick={handleMapClick} />
        <MapInitializer onMapReady={handleMapReady} />
        
        {userLocation && (
          <UserLocationMarker 
            position={[userLocation.latitude, userLocation.longitude]} 
            currentSiqs={currentSiqs}
          />
        )}
        
        {locations.map(location => {
          if (!location.latitude || !location.longitude) return null;
          
          const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
          const locationId = getLocationId(location);
          
          return (
            <LocationMarker
              key={locationId}
              location={location}
              onClick={handleLocationClick}
              locationId={locationId}
              isCertified={isCertified}
              activeView={activeView}
              onHover={onMarkerHover}
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
        
        <SiqsDetector 
          userLocation={userLocation} 
          locations={locations} 
          onSiqsDetected={setCurrentSiqs} 
        />
        
        <MapResizeHandler mapRef={mapRef} />
      </MapContainer>
    </div>
  );
};

export default LazyMapContainer;

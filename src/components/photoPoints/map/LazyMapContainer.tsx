
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MarkerStyles.css';
import './MapStyles.css';
import { LocationMarker, UserLocationMarker } from './MarkerComponents';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { configureLeaflet, getFastTileLayer, getTileLayerOptions } from '@/components/location/map/MapMarkerUtils';
import MapController from './MapController';
import MapLegend from './MapLegend';
import MobileMapFixer from './MobileMapFixer';
import { MapEvents } from './MapEffectsController';
import PinpointButton from './PinpointButton';
import { getCurrentPosition } from '@/utils/geolocationUtils';
import { MapEffectsComposer } from './MapComponents';
import L from 'leaflet';

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
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
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
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  isMobile,
  useMobileMapFixer = false,
  showRadiusCircles = false
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Get the optimized tile layer options
  const tileOptions = getTileLayerOptions(Boolean(isMobile));
  
  // Ensure stable references to prevent unnecessary re-renders
  const stableOnLocationClick = useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick]);
  
  const stableOnMapClick = useCallback((lat: number, lng: number) => {
    if (onMapClick) {
      onMapClick(lat, lng);
      console.log("Map clicked, updating location to:", lat, lng);
    }
  }, [onMapClick]);
  
  const handleSiqsCalculated = useCallback((siqs: number) => {
    setCurrentSiqs(siqs);
  }, []);
  
  // Ensure userLocation is always passed as a stable reference
  const safeUserLocation = userLocation || null;
  
  useEffect(() => {
    if (userLocation && locations.length > 0) {
      const userLat = userLocation.latitude;
      const userLng = userLocation.longitude;
      
      const sameLocation = locations.find(loc => 
        Math.abs(loc.latitude - userLat) < 0.0001 && 
        Math.abs(loc.longitude - userLng) < 0.0001
      );
      
      if (sameLocation && sameLocation.siqs) {
        setCurrentSiqs(sameLocation.siqs);
      } else {
        setCurrentSiqs(null);
      }
    }
  }, [userLocation, locations]);
  
  const handleMapReady = useCallback(() => {
    setMapReady(true);
    if (onMapReady) {
      onMapReady();
    }
  }, [onMapReady]);
  
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    const handleResize = () => {
      if (map) map.invalidateSize();
    };
    
    window.addEventListener('resize', handleResize);
    
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mapRef.current]);

  const getDefaultZoom = () => {
    if (activeView === 'calculated') {
      return 7;
    }
    return zoom;
  };

  return (
    <div ref={mapContainerRef} className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={getDefaultZoom()}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        ref={mapRef}
        className={`map-container ${isMobile ? 'mobile-optimized' : ''}`}
        whenReady={handleMapReady}
        attributionControl={true}
        worldCopyJump={true}
      >
        <TileLayer
          attribution={tileOptions.attribution}
          url={tileOptions.url}
          maxZoom={tileOptions.maxZoom}
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
          userLocation={safeUserLocation}
          activeView={activeView}
          searchRadius={searchRadius}
          onSiqsCalculated={handleSiqsCalculated}
        />
        
        <MapEvents onMapClick={stableOnMapClick} />
        
        {userLocation && (
          <UserLocationMarker 
            position={[userLocation.latitude, userLocation.longitude]} 
            currentSiqs={currentSiqs}
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
          userLocation={safeUserLocation} 
          searchRadius={searchRadius}
        />
        
        {useMobileMapFixer && isMobile && <MobileMapFixer />}
      </MapContainer>
    </div>
  );
};

export default LazyMapContainer;

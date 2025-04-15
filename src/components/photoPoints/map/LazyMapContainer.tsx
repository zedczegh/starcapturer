
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MarkerStyles.css';
import './MapStyles.css';
import { LocationMarker, UserLocationMarker } from './MarkerComponents';
import { SharedAstroSpot } from '@/types/weather';
import { configureLeaflet, getFastTileLayer, getTileLayerOptions } from '@/components/location/map/MapMarkerUtils';
import MapController from './MapController';
import MapLegend from './MapLegend';
import MobileMapFixer from './MobileMapFixer';
import { MapEvents } from './MapEffectsController';
import { MapEffectsComposer } from './MapComponents';
import L from 'leaflet';
import CenteringPinpointButton from './CenteringPinpointButton';

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
  const isMountedRef = useRef(true);
  
  console.log(`LazyMapContainer rendering with ${locations.length} locations, activeView: ${activeView}`);
  
  const tileOptions = isMobile ? 
    getTileLayerOptions(true) : 
    getTileLayerOptions(Boolean(isMobile));
  
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
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    if (userLocation && locations.length > 0 && isMountedRef.current) {
      const userLat = userLocation.latitude;
      const userLng = userLocation.longitude;
      
      const sameLocation = locations.find(loc => 
        Math.abs(loc.latitude - userLat) < 0.0001 && 
        Math.abs(loc.longitude - userLng) < 0.0001
      );
      
      if (sameLocation) {
        if (typeof sameLocation.siqs === 'number') {
          setCurrentSiqs(sameLocation.siqs);
        } else if (sameLocation.siqs && typeof sameLocation.siqs === 'object') {
          setCurrentSiqs(sameLocation.siqs.score);
        } else if (sameLocation.siqsResult) {
          setCurrentSiqs(sameLocation.siqsResult.score);
        }
      }
    }
  }, [userLocation?.latitude, userLocation?.longitude, locations]); 
  
  const handleMapReady = useCallback(() => {
    if (isMountedRef.current) {
      setMapReady(true);
      if (onMapReady) {
        onMapReady();
      }
    }
  }, [onMapReady]);
  
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    let resizeTimeout: number | null = null;
    const handleResize = () => {
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(() => {
        if (map) map.invalidateSize();
        resizeTimeout = null;
      }, 300);
    };
    
    window.addEventListener('resize', handleResize);
    
    const timeoutId = setTimeout(() => {
      if (map) map.invalidateSize();
    }, 300);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout);
      }
      clearTimeout(timeoutId);
    };
  }, []);

  const getDefaultZoom = () => {
    if (activeView === 'calculated') {
      return isMobile ? 6 : 7;
    }
    return isMobile ? zoom - 1 : zoom;
  };

  return (
    <div ref={mapContainerRef} className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={getDefaultZoom()}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={!isMobile}
        ref={mapRef}
        className={`map-container ${isMobile ? 'mobile-optimized' : ''}`}
        whenReady={handleMapReady}
        attributionControl={!isMobile}
        worldCopyJump={true}
        doubleClickZoom={!isMobile}
      >
        <TileLayer
          attribution={tileOptions.attribution}
          url={tileOptions.url}
          maxZoom={isMobile ? tileOptions.maxZoom - 2 : tileOptions.maxZoom}
        />
        
        {showRadiusCircles && userLocation && !isMobile && (
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
          userLocation={userLocation}
          activeView={activeView}
          searchRadius={searchRadius}
        />
        
        <MapEvents onMapClick={stableOnMapClick} />
        
        {userLocation && (
          <UserLocationMarker 
            position={[userLocation.latitude, userLocation.longitude]} 
            currentSiqs={currentSiqs}
          />
        )}
        
        {Array.isArray(locations) && locations.map(location => {
          if (!location || !location.latitude || !location.longitude) return null;
          
          const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
          const locationId = location.id || `loc-${location.latitude?.toFixed(6)}-${location.longitude?.toFixed(6)}`;
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
          doubleClickZoom={!isMobile}
        />
      </MapContainer>
    </div>
  );
};

export default LazyMapContainer;


import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MarkerStyles.css';
import './MapStyles.css';
import { UserLocationMarker } from './MarkerComponents';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { configureLeaflet } from '@/components/location/map/MapMarkerUtils';
import MapController from './MapController';
import MapLegend from './MapLegend';
import { MapEvents } from './MapEffectsController';
import PinpointButton from './PinpointButton';
import { MapEffectsComposer } from './MapComponents';
import MapTileLayer from './containers/MapTileLayer';
import MapSearchRadius from './containers/MapSearchRadius';
import MapLocations from './containers/MapLocations';

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
  isMobile = false,
  useMobileMapFixer = false,
  showRadiusCircles = false
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  
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
  
  // Update current SIQS when user location changes
  useEffect(() => {
    if (userLocation && locations.length > 0 && isMountedRef.current) {
      const userLat = userLocation.latitude;
      const userLng = userLocation.longitude;
      
      const sameLocation = locations.find(loc => 
        Math.abs(loc.latitude - userLat) < 0.0001 && 
        Math.abs(loc.longitude - userLng) < 0.0001 && 
        loc.siqs !== undefined
      );
      
      if (sameLocation && sameLocation.siqs) {
        setCurrentSiqs(sameLocation.siqs);
      }
    }
  }, [userLocation?.latitude, userLocation?.longitude, locations.length]); 
  
  // Handle map ready event
  const handleMapReady = useCallback(() => {
    if (isMountedRef.current) {
      setMapReady(true);
      if (onMapReady) {
        onMapReady();
      }
    }
  }, [onMapReady]);
  
  // Handle map resize
  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    
    let resizeTimeout: number | null = null;
    const handleResize = () => {
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(() => {
        if (map && map._loaded) map.invalidateSize();
        resizeTimeout = null;
      }, 300);
    };
    
    window.addEventListener('resize', handleResize);
    
    const timeoutId = setTimeout(() => {
      if (map && map._loaded) map.invalidateSize();
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
  
  // Handle pinpoint button click
  const handlePinpointClick = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.latitude, userLocation.longitude], mapRef.current.getZoom(), {
        animate: true,
        duration: 0.5
      });
    }
  }, [userLocation]);

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
      >
        <MapTileLayer isMobile={isMobile} />
        
        <MapSearchRadius 
          userLocation={userLocation} 
          searchRadius={searchRadius}
          showRadius={showRadiusCircles}
        />
        
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
        
        <MapLocations
          locations={locations}
          onLocationClick={stableOnLocationClick}
          hoveredLocationId={hoveredLocationId || null}
          onMarkerHover={onMarkerHover || (() => {})}
          handleTouchStart={handleTouchStart}
          handleTouchEnd={handleTouchEnd}
          handleTouchMove={handleTouchMove}
          isMobile={!!isMobile}
          activeView={activeView}
        />
        
        <MapController 
          userLocation={userLocation} 
          searchRadius={searchRadius}
          doubleClickZoom={!isMobile}
        />
      </MapContainer>

      {/* Map controls positioning */}
      <div className="absolute z-[999] top-4 right-4">
        <PinpointButton 
          onGetLocation={handlePinpointClick}
          className=""
        />
      </div>

      <div className="absolute z-[999] right-4 bottom-4">
        {!isMobile && (
          <MapLegend 
            activeView={activeView} 
            showStarLegend={activeView === 'certified'}
            showCircleLegend={activeView === 'calculated'}
          />
        )}
      </div>
    </div>
  );
};

export default LazyMapContainer;

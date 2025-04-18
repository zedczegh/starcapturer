
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MarkerStyles.css';
import './MapStyles.css';
import { LocationMarker } from './MarkerComponents';
import { UserLocationMarker } from './MarkerComponents';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { configureLeaflet, getFastTileLayer, getTileLayerOptions } from '@/components/location/map/MapMarkerUtils';
import MapController from './MapController';
import MapLegend from './MapLegend';
import MobileMapFixer from './MobileMapFixer';
import { MapEvents } from './MapEffectsController';
import { MapEffectsComposer } from './MapComponents';
import L from 'leaflet';
import { calculateDistance, getSafeScore } from '@/utils/geoUtils';
import { filterLocations, optimizeLocationsForMobile } from './MapUtils';
import { isWaterLocation } from '@/utils/locationWaterCheck';
import RealTimeSiqsProvider from '../cards/RealTimeSiqsProvider';

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
  const previousLocations = useRef<SharedAstroSpot[]>([]);
  
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
  
  // Handle real-time SIQS for user location
  const handleUserLocationSiqs = useCallback((siqs: number | null, loading: boolean) => {
    if (!loading && siqs !== null) {
      setCurrentSiqs(siqs);
    }
  }, []);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  useEffect(() => {
    if (locations && locations.length > 0) {
      const locationIds = new Set(locations.map(loc => 
        `${loc.latitude?.toFixed(6)}-${loc.longitude?.toFixed(6)}`
      ));
      
      const previousToKeep = previousLocations.current.filter(loc => {
        const locId = `${loc.latitude?.toFixed(6)}-${loc.longitude?.toFixed(6)}`;
        return !locationIds.has(locId);
      });
      
      const combinedLocations = activeView === 'calculated' 
        ? [...locations, ...previousToKeep] 
        : locations;
      
      previousLocations.current = combinedLocations;
    }
  }, [locations, activeView]);
  
  const filteredLocations = useCallback(() => {
    if (!previousLocations.current || previousLocations.current.length === 0) {
      return locations || [];
    }
    
    const filtered = filterLocations(previousLocations.current, userLocation, searchRadius, activeView);
    return optimizeLocationsForMobile(filtered, Boolean(isMobile), activeView);
  }, [locations, userLocation, searchRadius, activeView, isMobile]);

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
      return isMobile ? 3 : 4;
    }
    return isMobile ? zoom - 1 : zoom;
  };

  const displayLocations = filteredLocations();

  return (
    <div ref={mapContainerRef} className="relative w-full h-full">
      {/* Add real-time SIQS calculator for user location */}
      {userLocation && (
        <RealTimeSiqsProvider
          isVisible={true}
          latitude={userLocation.latitude}
          longitude={userLocation.longitude}
          bortleScale={4}
          onSiqsCalculated={handleUserLocationSiqs}
        />
      )}
      
      <MapContainer
        center={center}
        zoom={getDefaultZoom()}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={!isMobile}
        ref={mapRef}
        className={`map-container ${isMobile ? 'mobile-optimized' : ''}`}
        whenReady={() => {
          setMapReady(true);
          if (onMapReady) onMapReady();
        }}
        attributionControl={false}
        worldCopyJump={true}
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
          effects={['zoom-controls']}
        />
        
        {onMapClick && (
          <MapController 
            userLocation={userLocation} 
            searchRadius={searchRadius} 
            onMapClick={stableOnMapClick}
          />
        )}
        
        {userLocation && (
          <UserLocationMarker 
            position={[userLocation.latitude, userLocation.longitude]} 
            currentSiqs={currentSiqs}
          />
        )}
        
        {displayLocations.map(location => {
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
              isMobile={Boolean(isMobile)}
              handleTouchStart={handleTouchStart}
              handleTouchEnd={handleTouchEnd}
              handleTouchMove={handleTouchMove}
            />
          );
        })}
        
        {useMobileMapFixer && isMobile && <MobileMapFixer />}
        
        <MapLegend activeView={activeView} />
      </MapContainer>
    </div>
  );
};

export default React.memo(LazyMapContainer);

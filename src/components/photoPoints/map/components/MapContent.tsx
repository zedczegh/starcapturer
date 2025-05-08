
import React, { useMemo, memo } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { MapUpdater, MapEvents, DarkSkyOverlay, MapInteractionManager } from '@/components/location/map/MapEffectsComponents';
import MarkerClusterGroup from '@/components/location/map/MarkerClusterGroup';
import { LocationMarker } from '@/components/photoPoints/map/components/LocationMarker';
import SearchRadiusCircle from '@/components/photoPoints/map/components/SearchRadiusCircle';
import UserLocationMarker from '@/components/photoPoints/map/components/UserLocationMarker';
import MobileMapFixer from '@/components/photoPoints/map/MobileMapFixer';
import MapAttribution from '@/components/photoPoints/map/components/MapAttribution';

// Load tiles with priority system for mobile optimization
const LoadTilesWithPriority = memo(() => {
  const map = useMapEvents({
    // Prioritize map loading on mobile devices
    load: () => {
      // Apply hardware acceleration to map panes
      const panes = map._panes;
      if (!panes) return;
      
      for (const key in panes) {
        if (panes[key] && panes[key].style) {
          panes[key].style.transform = 'translate3d(0, 0, 0)';
          panes[key].style.backfaceVisibility = 'hidden';
        }
      }
      
      // Force immediate load and redraw of visible tiles
      setTimeout(() => {
        map.invalidateSize();
        map._onResize();
      }, 100);
    }
  });
  
  return null;
});

interface MapContentProps {
  center: [number, number];
  userLocation: { latitude: number; longitude: number } | null;
  zoom: number;
  displayLocations: SharedAstroSpot[];
  isMobile: boolean;
  activeView: 'certified' | 'calculated';
  searchRadius: number;
  showRadiusCircles: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onLocationClick?: (location: SharedAstroSpot) => void;
  hoveredLocationId?: string | null;
  onMarkerHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  useMobileMapFixer?: boolean;
  mapRef: React.MutableRefObject<any>;
  onMapReady?: () => void;
  currentSiqs?: number | null;
}

const MapContent: React.FC<MapContentProps> = ({
  center,
  userLocation,
  zoom,
  displayLocations,
  isMobile,
  activeView,
  searchRadius,
  showRadiusCircles,
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
  currentSiqs
}) => {
  // Memoize markers to prevent rerenders
  const locationMarkers = useMemo(() => {
    return displayLocations.map(location => (
      <LocationMarker
        key={location.id || `${location.latitude}-${location.longitude}`}
        location={location}
        isHovered={hoveredLocationId === location.id}
        onClick={() => onLocationClick?.(location)}
        onHover={onMarkerHover}
        onTouchStart={handleTouchStart ? (e) => handleTouchStart(e, location.id || '') : undefined}
        onTouchEnd={handleTouchEnd ? (e) => handleTouchEnd(e, location.id || '') : undefined} 
        certifiedView={activeView === 'certified'}
      />
    ));
  }, [
    displayLocations, 
    hoveredLocationId, 
    onLocationClick, 
    onMarkerHover,
    handleTouchStart,
    handleTouchEnd,
    activeView
  ]);

  // Configure map tile layers for better mobile performance
  const tileLayerUrl = useMemo(() => {
    // Use a caching proxy or optimized tile server if on mobile
    return isMobile 
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'  // Consider a mobile-optimized tile server here
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  }, [isMobile]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      attributionControl={false}
      className="leaflet-map"
      ref={mapRef}
      zoomControl={!isMobile}
      touchZoom={true}
      dragging={true}
      preferCanvas={true}
      worldCopyJump={false}
      fadeAnimation={!isMobile} // Disable fade animations on mobile for better performance
      markerZoomAnimation={!isMobile} // Disable marker animations on mobile
    >
      {/* Add mobile-specific fixes */}
      <LoadTilesWithPriority />
      
      {/* Mobile optimized tile layer */}
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url={tileLayerUrl}
        maxNativeZoom={19}
        maxZoom={19}
        subdomains="abc"
        keepBuffer={isMobile ? 2 : 4} // Smaller buffer for mobile to save memory
      />
      
      {/* Map interactions and effects */}
      <MapUpdater position={center} />
      {onMapClick && <MapEvents onMapClick={onMapClick} />}
      <MapInteractionManager onReady={onMapReady} />
      
      {/* User location and search radius */}
      {userLocation && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]} 
          siqs={currentSiqs} 
          isMobile={isMobile}
        />
      )}
      
      {showRadiusCircles && userLocation && (
        <SearchRadiusCircle 
          center={[userLocation.latitude, userLocation.longitude]} 
          radius={searchRadius * 1000}
          isCalculatedView={activeView === 'calculated'}
          isMobile={isMobile}
        />
      )}
      
      {/* Location markers with clustering for better performance */}
      <MarkerClusterGroup
        chunkedLoading={true}
        showCoverageOnHover={false}
        maxClusterRadius={isMobile ? 60 : 40}
        disableClusteringAtZoom={activeView === 'certified' ? 8 : 10}
        spiderfyOnMaxZoom={activeView === 'certified'}
        zoomToBoundsOnClick={true}
        animate={!isMobile} // Disable animations on mobile for better performance
      >
        {locationMarkers}
      </MarkerClusterGroup>
      
      {/* Map attribution */}
      <MapAttribution isMobile={isMobile} />
      
      {/* Additional mobile optimizations */}
      {useMobileMapFixer && <MobileMapFixer />}
    </MapContainer>
  );
};

export default memo(MapContent);

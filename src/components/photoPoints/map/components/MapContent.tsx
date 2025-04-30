
import React from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { LocationMarker, UserLocationMarker, ForecastMarker } from '../MarkerComponents';
import { MapEffectsComposer } from '../MapComponents';
import MapController from '../MapController';
import MobileMapFixer from '../MobileMapFixer';
import { getTileLayerOptions } from '@/components/location/map/MapMarkerUtils';

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
  useMobileMapFixer: boolean;
  mapRef: React.RefObject<any>;
  onMapReady: () => void;
  currentSiqs: number | null;
  showForecast?: boolean;
  forecastDay?: number;
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
  useMobileMapFixer,
  mapRef,
  onMapReady,
  currentSiqs,
  showForecast = false,
  forecastDay = 0
}) => {
  const tileOptions = getTileLayerOptions(Boolean(isMobile));
  
  const getDefaultZoom = () => {
    if (activeView === 'calculated') {
      return isMobile ? 3 : 4;
    }
    return isMobile ? zoom - 1 : zoom;
  };

  const stableOnLocationClick = React.useCallback((location: SharedAstroSpot) => {
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick]);

  const stableOnMapClick = React.useCallback((lat: number, lng: number) => {
    if (onMapClick) {
      onMapClick(lat, lng);
    }
  }, [onMapClick]);

  const handleMarkerHover = React.useCallback((id: string | null) => {
    if (onMarkerHover) {
      onMarkerHover(id);
    }
  }, [onMarkerHover]);

  return (
    <MapContainer
      center={center}
      zoom={getDefaultZoom()}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={!isMobile}
      ref={mapRef}
      className={`map-container ${isMobile ? 'mobile-optimized' : ''}`}
      whenReady={onMapReady}
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
        
        const isForecastMarker = Boolean(location.isForecast);
        const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
        const locationId = location.id || `loc-${location.latitude?.toFixed(6)}-${location.longitude?.toFixed(6)}`;
        const isHovered = hoveredLocationId === locationId;
        
        // Use different marker component for forecast locations
        if (isForecastMarker && showForecast) {
          return (
            <ForecastMarker
              key={locationId}
              location={location}
              onClick={() => stableOnLocationClick(location)}
              onHover={() => handleMarkerHover(locationId)}
              onMouseOut={() => handleMarkerHover(null)}
              isHovered={isHovered}
              locationId={locationId}
              forecastDay={forecastDay}
              handleTouchStart={handleTouchStart}
              handleTouchEnd={handleTouchEnd}
              handleTouchMove={handleTouchMove}
            />
          );
        }
        
        // Skip forecast markers if forecast view is not active
        if (isForecastMarker && !showForecast) {
          return null;
        }
        
        return (
          <LocationMarker
            key={locationId}
            location={location}
            onClick={() => stableOnLocationClick(location)}
            onHover={() => handleMarkerHover(locationId)}
            onMouseOut={() => handleMarkerHover(null)}
            isHovered={isHovered}
            locationId={locationId}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
            handleTouchMove={handleTouchMove}
          />
        );
      })}
      
      {useMobileMapFixer && isMobile && <MobileMapFixer />}
    </MapContainer>
  );
};

export default React.memo(MapContent);

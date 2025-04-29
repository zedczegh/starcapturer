
import React from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import { SharedAstroSpot } from '@/types/weather';
import { LocationMarker, UserLocationMarker } from '../MarkerComponents';
import { Circle } from 'react-leaflet';

// Map event handler component
const MapEventHandler: React.FC<{
  onMapClick?: (lat: number, lng: number) => void;
  onMapLoad?: () => void;
}> = ({ onMapClick, onMapLoad }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (onMapLoad) {
      onMapLoad();
    }
    
    if (onMapClick) {
      const handleMapClick = (e: any) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      };
      
      map.addEventListener('click', handleMapClick);
      
      return () => {
        map.removeEventListener('click', handleMapClick);
      };
    }
    
    return undefined;
  }, [map, onMapClick, onMapLoad]);
  
  return null;
};

// MapRef effect component
const MapRefEffect: React.FC<{
  mapRef: React.MutableRefObject<any>;
}> = ({ mapRef }) => {
  const map = useMap();
  
  React.useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);
  
  return null;
};

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
  isForecastMode?: boolean;
  selectedForecastDay?: number;
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
  isForecastMode = false,
  selectedForecastDay = 0
}) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%', borderRadius: '0.375rem' }}
      zoomControl={false}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomleft" />
      <MapEventHandler onMapClick={onMapClick} onMapLoad={onMapReady} />
      <MapRefEffect mapRef={mapRef} />
      
      {/* User location marker */}
      {userLocation && (
        <UserLocationMarker 
          position={[userLocation.latitude, userLocation.longitude]} 
          currentSiqs={currentSiqs || null} 
        />
      )}
      
      {/* Search radius circles */}
      {showRadiusCircles && userLocation && (
        <Circle
          center={[userLocation.latitude, userLocation.longitude]}
          pathOptions={{ 
            color: '#3B82F6', 
            fillColor: '#3B82F6', 
            fillOpacity: 0.05,
            weight: 1,
            dashArray: '5, 5'
          }}
          radius={searchRadius * 1000}
        />
      )}
      
      {/* Location markers */}
      {displayLocations.map((location) => {
        const isCertified = Boolean(location.isDarkSkyReserve || location.certification);
        const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
        const isHovered = hoveredLocationId === locationId;
        
        return (
          <LocationMarker
            key={locationId}
            location={location}
            onClick={onLocationClick || (() => {})}
            isHovered={isHovered}
            onHover={onMarkerHover || (() => {})}
            locationId={locationId}
            isCertified={isCertified}
            activeView={activeView}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
            handleTouchMove={handleTouchMove}
            isForecast={isForecastMode || Boolean(location.isForecast)}
          />
        );
      })}
    </MapContainer>
  );
};

export default React.memo(MapContent);

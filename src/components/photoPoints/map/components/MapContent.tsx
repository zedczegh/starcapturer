
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import { SharedAstroSpot } from '@/types/weather';
import { SearchRadiusCircles } from './SearchRadiusCircles';
import { UserLocationMarker } from './UserLocationMarker';
import { MapEffectsComposer } from './MapEffectsComposer';
import { LocationMarkerComponent } from '../MarkerComponents';

// Define the props interface
export interface MapContentProps {
  center: [number, number];
  userLocation: { latitude: number; longitude: number } | null;
  zoom: number;
  locations: SharedAstroSpot[];
  isMobile: boolean;
  activeView: 'certified' | 'calculated';
  showRadiusCircles: boolean;
  onMapReady?: () => void;
  onMapClick?: (e: any) => void;
  onMarkerClick?: (location: SharedAstroSpot) => void;
  onMarkerHover?: (id: string | null) => void;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  hoveredLocationId?: string | null;
  isForecastMode?: boolean;
  selectedForecastDay?: number;
}

// Map initialization effect component
const MapInitializer: React.FC<{ onMapReady?: () => void }> = ({ onMapReady }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map && onMapReady) {
      console.log('Map is ready, notifying parent component');
      onMapReady();
    }
  }, [map, onMapReady]);
  
  return null;
};

export const MapContent: React.FC<MapContentProps> = ({
  center,
  userLocation,
  zoom,
  locations,
  isMobile,
  activeView,
  showRadiusCircles,
  onMapReady,
  onMapClick,
  onMarkerClick,
  onMarkerHover,
  handleTouchStart,
  handleTouchEnd,
  hoveredLocationId,
  isForecastMode = false,
  selectedForecastDay = 0
}) => {
  const mapRef = useRef(null);
  
  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ background: '#111' }}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapInitializer onMapReady={onMapReady} />
        
        {/* Show radius circles when enabled */}
        {showRadiusCircles && userLocation && (
          <SearchRadiusCircles 
            center={[userLocation.latitude, userLocation.longitude]}
            activeView={activeView}
          />
        )}
        
        {/* Display all location markers */}
        {locations.map((location) => (
          <LocationMarkerComponent
            key={location.id || `${location.latitude}-${location.longitude}`}
            location={location}
            realTimeSiqs={null}
            isUserMarker={false}
            isCertified={!!location.certification || !!location.isDarkSkyReserve}
            icon={null} // This will be handled internally in LocationMarkerComponent
            isHovered={hoveredLocationId === location.id}
            onMarkerClick={onMarkerClick ? onMarkerClick : () => {}}
            onMarkerHover={onMarkerHover ? onMarkerHover : () => {}}
            isMobile={isMobile}
            handleTouchStart={handleTouchStart}
            handleTouchEnd={handleTouchEnd}
            displayName={location.name || location.displayName || "Unnamed Location"}
            siqsScore={typeof location.siqs === 'number' ? location.siqs : null}
          />
        ))}
        
        {/* Show user location marker */}
        {userLocation && (
          <UserLocationMarker 
            position={[userLocation.latitude, userLocation.longitude]} 
          />
        )}
        
        {/* Map effects composer for additional functionality */}
        <MapEffectsComposer
          showRadiusCircles={showRadiusCircles}
          userLocation={userLocation}
          activeView={activeView}
          isForecastMode={isForecastMode}
          onMapClick={onMapClick}
        />
      </MapContainer>
    </div>
  );
};

export default MapContent;

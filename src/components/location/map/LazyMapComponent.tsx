
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from "leaflet";
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { createCustomMarker, getFastTileLayer, getTileLayerOptions } from './MapMarkerUtils';
import { useMapEvents } from '@/hooks/map/useMapEvents';
import MapLocationPopup from './MapLocationPopup';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface LazyMapComponentProps {
  position: [number, number];
  locationName: string;
  editable?: boolean;
  onMapReady: () => void;
  onMapClick: (lat: number, lng: number) => void;
  showInfoPanel?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
}

const MapEvents = ({ onMapReady }: { onMapReady: () => void }) => {
  useEffect(() => {
    onMapReady();
  }, [onMapReady]);
  return null;
};

const LazyMapComponent: React.FC<LazyMapComponentProps> = ({
  position,
  locationName,
  editable = false,
  onMapReady,
  onMapClick,
  isDarkSkyReserve = false,
  certification = ''
}) => {
  const isMobile = useIsMobile();
  
  // Get optimized tile layer
  const { url: tileUrl } = getFastTileLayer();
  const tileOptions = getTileLayerOptions(isMobile);
  
  // Get custom marker icon
  const markerIcon = useMemo(() => {
    const markerColor = editable ? '#ea384c' : '#3b82f6';
    return createCustomMarker(markerColor);
  }, [editable]);
  
  // Configure map options
  const mapOptions: L.MapOptions = {
    center: position,
    zoom: 5,
    attributionControl: false,
    scrollWheelZoom: true,
    tap: isMobile,
    touchZoom: isMobile ? 'center' : true,
    zoomAnimation: !isMobile,
    fadeAnimation: !isMobile,
    markerZoomAnimation: !isMobile,
    inertia: true,
    inertiaDeceleration: isMobile ? 2000 : 3000,
    wheelDebounceTime: isMobile ? 40 : 80,
    zoomSnap: isMobile ? 0.5 : 1,
    worldCopyJump: true,
  };
  
  return (
    <MapContainer
      {...mapOptions}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      whenReady={() => onMapReady()}
      attributionControl={false}
    >
      <TileLayer
        attribution=""
        url={tileOptions.url}
        maxZoom={tileOptions.maxZoom}
      />
      <Marker position={position} icon={markerIcon}>
        <MapLocationPopup
          name={locationName}
          position={position}
          isDarkSkyReserve={isDarkSkyReserve}
          certification={certification}
        />
      </Marker>
      
      <MapEvents onMapReady={onMapReady} />
      {(isMobile || editable) && (
        <MapEventHandler onMapClick={onMapClick} editable={editable} />
      )}
    </MapContainer>
  );
};

// Internal component to handle map events
const MapEventHandler = ({ onMapClick, editable }: { onMapClick: (lat: number, lng: number) => void; editable?: boolean }) => {
  useMapEvents({ onMapClick, editable });
  return null;
};

export default LazyMapComponent;

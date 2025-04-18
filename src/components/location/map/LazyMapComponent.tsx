
import React from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { createCustomMarker } from './MapMarkerUtils';
import MapTooltip from './MapTooltip';
import MapClickHandler from './MapClickHandler';

export interface LazyMapComponentProps {
  position: [number, number];
  locationName: string;
  editable?: boolean;
  onMapReady?: () => void;
  onMapClick?: (lat: number, lng: number) => void;
  showInfoPanel?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
  siqs?: number;
}

const LazyMapComponent: React.FC<LazyMapComponentProps> = ({
  position,
  locationName,
  editable = false,
  onMapReady,
  onMapClick,
  showInfoPanel = false,
  isDarkSkyReserve = false,
  certification = '',
  siqs
}) => {
  // Custom marker icon
  const markerColor = isDarkSkyReserve || certification ? '#8b5cf6' : '#3b82f6';
  const markerIcon = createCustomMarker(markerColor);
  
  // MapReady component to handle initialization
  const MapReady = () => {
    const map = useMap();
    
    React.useEffect(() => {
      // Store map reference for global access
      (window as any).leafletMap = map;
      
      // Call onMapReady callback
      if (onMapReady) {
        onMapReady();
      }
    }, [map]);
    
    return null;
  };
  
  return (
    <MapContainer
      center={position}
      zoom={10}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <Marker position={position} icon={markerIcon}>
        <MapTooltip 
          name={locationName} 
          latitude={position[0]} 
          longitude={position[1]}
          isDarkSkyReserve={isDarkSkyReserve}
          certification={certification}
          siqs={siqs}
        />
      </Marker>
      
      {/* Map initialization event */}
      <MapReady />
      
      {/* Map click handler */}
      {editable && onMapClick && (
        <MapClickHandler onClick={onMapClick} />
      )}
    </MapContainer>
  );
};

export default LazyMapComponent;


import React from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../MapStyles.css';
import '../MarkerStyles.css';
import { configureLeaflet } from '@/components/location/map/MapMarkerUtils';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

// Configure Leaflet once
configureLeaflet();

interface MapBaseProps {
  center: [number, number];
  zoom: number;
  userLocation: { latitude: number; longitude: number } | null;
  searchRadius: number;
  showRadiusCircles?: boolean;
  isMobile?: boolean;
  children: React.ReactNode;
  onMapReady: () => void;
}

/**
 * Base Map Component - handles the core MapContainer setup
 */
const MapBase: React.FC<MapBaseProps> = ({
  center,
  zoom,
  userLocation,
  searchRadius,
  showRadiusCircles = false,
  isMobile = false,
  children,
  onMapReady
}) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
      className={`map-container ${isMobile ? 'mobile-optimized' : ''}`}
      whenReady={onMapReady}
      attributionControl={true}
      // We can't set these properties directly on MapContainer, so they need to be handled in controllers
      // Instead of using these props directly
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
      
      {children}
    </MapContainer>
  );
};

export default MapBase;

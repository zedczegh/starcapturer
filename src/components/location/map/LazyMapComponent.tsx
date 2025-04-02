
import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapStyles } from './MapStyles';
import { createCustomMarker } from './MapComponents';
import { Loader2 } from 'lucide-react';
import { MapEvents, MapUpdater, DarkSkyOverlay } from './MapEffectsComponents';

// Use dynamic import for map components
const DynamicMarker = lazy(() => import('./DynamicMarker'));

interface MapProps {
  position: [number, number];
  zoom?: number;
  style?: React.CSSProperties;
  className?: string;
  width?: string | number;
  height?: string | number;
  isDarkSkyReserve?: boolean;
  certification?: string;
  locationName?: string;
  editable?: boolean;
  showInfoPanel?: boolean;
  onMapReady?: () => void;
  onMapClick?: (lat: number, lng: number) => void;
  markers?: Array<{
    position: [number, number];
    popup?: string;
    color?: string;
  }>;
}

const LazyMapComponent: React.FC<MapProps> = ({ 
  position, 
  zoom = 13, 
  style,
  className,
  width = '100%',
  height = '400px',
  isDarkSkyReserve = false,
  certification,
  locationName,
  editable = false,
  showInfoPanel = false,
  onMapReady = () => {},
  onMapClick = () => {},
  markers = []
}) => {
  // Create the custom marker icon
  const icon = createCustomMarker('#3b82f6');
  const isMapReadyRef = useRef(false);
  
  // Call onMapReady after component mounts
  useEffect(() => {
    if (!isMapReadyRef.current && onMapReady) {
      isMapReadyRef.current = true;
      // Small delay to ensure the map is fully loaded
      const timer = setTimeout(() => {
        onMapReady();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [onMapReady]);
  
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{width, height}}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <div style={{ width, height, ...style }} className={className}>
        <MapContainer 
          center={position} 
          zoom={zoom} 
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapStyles />
          
          {/* Main location marker */}
          <Marker position={position} icon={icon}>
            <Popup>
              {locationName || `Position: ${position[0].toFixed(4)}, ${position[1].toFixed(4)}`}
            </Popup>
          </Marker>
          
          {/* Additional markers if provided */}
          {markers.map((marker, index) => (
            <DynamicMarker 
              key={`marker-${index}`}
              position={marker.position}
              popup={marker.popup}
              color={marker.color}
            />
          ))}
          
          {/* Map update effects */}
          <MapUpdater position={position} />
          
          {/* Add map click handler if editable */}
          {editable && <MapEvents onMapClick={onMapClick} />}
          
          {/* Add dark sky overlay if applicable */}
          {isDarkSkyReserve && <DarkSkyOverlay isDarkSkyReserve={isDarkSkyReserve} position={position} />}
        </MapContainer>
      </div>
    </Suspense>
  );
};

export default LazyMapComponent;

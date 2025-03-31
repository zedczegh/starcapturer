
import React, { lazy, Suspense } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLanguage } from '@/contexts/LanguageContext';

// Replace default Leaflet marker icons
const defaultIcon = L.icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Set default icon for all markers
L.Marker.prototype.options.icon = defaultIcon;

// Lazy load the actual map component to reduce initial load time
const MapComponent = lazy(() => import('./MapComponents'));

interface LazyMapComponentProps {
  center: [number, number];
  zoom: number;
  markers?: Array<{
    position: [number, number];
    content?: React.ReactNode;
    color?: string;
  }>;
  circles?: Array<{
    center: [number, number];
    radius: number;
    color: string;
    fillColor: string;
    weight?: number;
    opacity?: number;
    fillOpacity?: number;
  }>;
  onMapClick?: (lat: number, lng: number) => void;
  onMapMove?: (lat: number, lng: number) => void;
  className?: string;
  dragging?: boolean;
  scrollWheelZoom?: boolean;
  zoomControl?: boolean;
  attributionControl?: boolean;
}

const LazyMapComponent: React.FC<LazyMapComponentProps> = ({
  center,
  zoom,
  markers,
  circles,
  onMapClick,
  onMapMove,
  className = "",
  dragging = true,
  scrollWheelZoom = true,
  zoomControl = true,
  attributionControl = true
}) => {
  const { language } = useLanguage();
  
  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      <Suspense fallback={
        <div className="animate-pulse flex items-center justify-center bg-cosmic-800/30 h-full w-full min-h-[200px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">{language === 'en' ? 'Loading map...' : '加载地图中...'}</p>
          </div>
        </div>
      }>
        <MapContainer
          center={center}
          zoom={zoom}
          className="w-full h-full min-h-[200px]"
          dragging={dragging}
          scrollWheelZoom={scrollWheelZoom}
          zoomControl={zoomControl}
          attributionControl={attributionControl}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {markers && markers.map((marker, index) => (
            <Marker 
              key={`marker-${index}`} 
              position={marker.position}
              icon={marker.color ? L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: ${marker.color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white;"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              }) : defaultIcon}
            >
              {marker.content && <Popup>{marker.content}</Popup>}
            </Marker>
          ))}
          
          {circles && circles.map((circle, index) => (
            <Circle
              key={`circle-${index}`}
              center={circle.center}
              radius={circle.radius}
              pathOptions={{
                color: circle.color,
                fillColor: circle.fillColor,
                weight: circle.weight || 2,
                opacity: circle.opacity || 0.7,
                fillOpacity: circle.fillOpacity || 0.3
              }}
            />
          ))}
          
          <MapComponent onMapClick={onMapClick} onMapMove={onMapMove} />
        </MapContainer>
      </Suspense>
    </div>
  );
};

export default LazyMapComponent;

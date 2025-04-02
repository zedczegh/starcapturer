
import React, { Suspense, lazy } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';

const customIcon = new Icon({
  iconUrl: '/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: '/marker-shadow.png',
  shadowSize: [41, 41],
  shadowAnchor: [12, 41]
});

// Event handler component for map clicks
const MapEventHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

interface LazyMapComponentProps {
  position: [number, number];
  locationName: string;
  editable?: boolean;
  onMapReady?: () => void;
  onMapClick?: (lat: number, lng: number) => void;
  showInfoPanel?: boolean;
  isDarkSkyReserve?: boolean;
  certification?: string;
}

const LazyMapComponent: React.FC<LazyMapComponentProps> = ({ 
  position,
  locationName,
  editable = false,
  onMapReady = () => {},
  onMapClick = () => {},
  showInfoPanel = false,
  isDarkSkyReserve = false,
  certification = ''
}) => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <MapContainer 
        center={position} 
        zoom={13} 
        style={{ height: '300px', width: '100%' }}
        className="rounded-lg"
        whenReady={onMapReady}
      >
        {/* Add event handler for map clicks */}
        <MapEventHandler onMapClick={onMapClick} />
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position} icon={customIcon}>
          <Popup>
            {locationName}
          </Popup>
        </Marker>
        <Circle center={position} radius={100} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }}>
          <Popup>
            {locationName}
          </Popup>
        </Circle>
      </MapContainer>
    </Suspense>
  );
};

export default LazyMapComponent;

import React, { Suspense, lazy } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
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

interface LazyMapComponentProps {
  latitude: number;
  longitude: number;
  locationName: string;
}

const LazyMapComponent: React.FC<LazyMapComponentProps> = ({ latitude, longitude, locationName }) => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <MapContainer 
        center={[latitude, longitude]} 
        zoom={13} 
        style={{ height: '300px', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[latitude, longitude]} icon={customIcon}>
          <Popup>
            {locationName}
          </Popup>
        </Marker>
        <CircleMarker center={[latitude, longitude]} radius={5}>
          <Popup>
            {locationName}
          </Popup>
        </CircleMarker>
      </MapContainer>
    </Suspense>
  );
};

export default LazyMapComponent;

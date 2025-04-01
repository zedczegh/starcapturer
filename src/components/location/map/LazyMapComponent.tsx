import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import custom marker
import customMarker from '@/assets/custom-marker.png';
import customMarkerShadow from '@/assets/marker-shadow.png';

// Fix Leaflet's default marker issue
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

// Define the component props
interface LazyMapComponentProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markerLatitude?: number;
  markerLongitude?: number;
  radius?: number;
}

const LazyMapComponent: React.FC<LazyMapComponentProps> = ({
  latitude,
  longitude,
  zoom = 13,
  markerLatitude,
  markerLongitude,
  radius
}) => {
  const [map, setMap] = useState<L.Map | null>(null);
  
  // UseMemo to prevent re-renders unless the props change
  const position = useMemo(() => [latitude, longitude], [latitude, longitude]);
  const markerPosition = useMemo(() => {
    if (markerLatitude !== undefined && markerLongitude !== undefined) {
      return [markerLatitude, markerLongitude];
    }
    return null;
  }, [markerLatitude, markerLongitude]);
  
  // Custom map icon
  const customIcon = useMemo(() => {
    return L.icon({
      iconUrl: customMarker,
      shadowUrl: customMarkerShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }, []);
  
  // Fly to the location when latitude and longitude change
  useEffect(() => {
    if (map) {
      map.flyTo(position, zoom, {
        animate: true,
        duration: 1.0
      });
    }
  }, [map, position, zoom]);
  
  return (
    <MapContainer
      center={position}
      zoom={zoom}
      style={{ height: '300px', width: '100%' }}
      className="rounded-lg"
      whenCreated={setMap}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {markerPosition && (
        <Marker position={markerPosition} icon={customIcon}>
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>
        </Marker>
      )}
      
      {radius && (
        <Circle center={position} radius={radius * 1000} color="blue" fillColor="blue" fillOpacity={0.1} />
      )}
    </MapContainer>
  );
};

export default LazyMapComponent;

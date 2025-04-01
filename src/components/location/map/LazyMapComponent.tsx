
import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Default Leaflet marker images
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's default marker issue
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

// Define the component props
interface LazyMapComponentProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markerLatitude?: number;
  markerLongitude?: number;
  radius?: number;
  isDarkSkyReserve?: boolean;
  certification?: string;
}

// Create a circle component for radius visualization
const MapCircle: React.FC<{center: L.LatLngExpression, radius: number}> = ({ center, radius }) => {
  return (
    <div className="map-circle" style={{
      position: 'absolute',
      width: `${radius * 2}px`,
      height: `${radius * 2}px`,
      borderRadius: '50%',
      backgroundColor: 'rgba(66, 133, 244, 0.1)',
      border: '1px solid rgba(66, 133, 244, 0.5)',
      transform: 'translate(-50%, -50%)',
      top: '50%',
      left: '50%',
      pointerEvents: 'none',
      zIndex: 400
    }}></div>
  );
};

const LazyMapComponent: React.FC<LazyMapComponentProps> = ({
  latitude,
  longitude,
  zoom = 13,
  markerLatitude,
  markerLongitude,
  radius,
  isDarkSkyReserve = false,
  certification = ''
}) => {
  const [map, setMap] = useState<L.Map | null>(null);
  
  // UseMemo to prevent re-renders unless the props change
  const position = useMemo<[number, number]>(() => [latitude, longitude], [latitude, longitude]);
  const markerPosition = useMemo(() => {
    if (markerLatitude !== undefined && markerLongitude !== undefined) {
      return [markerLatitude, markerLongitude] as [number, number];
    }
    return null;
  }, [markerLatitude, markerLongitude]);
  
  // Custom map icon based on certification type
  const customIcon = useMemo(() => {
    // Define different icon styles based on certification type
    let iconUrl = markerIcon;
    let iconSize: [number, number] = [25, 41];
    
    // Apply custom styling for certified locations
    if (isDarkSkyReserve || certification) {
      // In a real implementation, you would use different icons for different certifications
      // For now, we'll just use the default marker with a custom color
      const color = isDarkSkyReserve ? 'darkblue' : 
                   certification.includes('Sanctuary') ? 'purple' :
                   certification.includes('Park') ? 'green' :
                   certification.includes('Community') ? 'orange' : 'blue';
      
      // For demo, we'll just use the default marker
      iconUrl = markerIcon;
    }
    
    return L.icon({
      iconUrl,
      shadowUrl: markerShadow,
      iconSize,
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }, [isDarkSkyReserve, certification]);
  
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
            {certification ? (
              <div>
                <strong>{isDarkSkyReserve ? 'Dark Sky Reserve' : certification}</strong><br />
                A certified location with excellent sky viewing conditions.
              </div>
            ) : (
              <div>
                A pretty CSS3 popup. <br /> Easily customizable.
              </div>
            )}
          </Popup>
        </Marker>
      )}
      
      {radius && map && (
        <div className="radius-indicator">
          {/* Simple circle overlay for radius visualization */}
          <MapCircle center={position} radius={radius * 100} />
        </div>
      )}
    </MapContainer>
  );
};

export default LazyMapComponent;

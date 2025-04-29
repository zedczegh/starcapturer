
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface UserLocationMarkerProps {
  position: [number, number];
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ position }) => {
  // Create a custom icon for the user location marker
  const userIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
  
  return (
    <Marker position={position} icon={userIcon}>
      <Popup>
        <div className="p-2">
          <h3 className="font-medium text-base">Your Location</h3>
          <p className="text-xs text-gray-600">
            {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

export default UserLocationMarker;


import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface UserLocationMarkerProps {
  userLocation: [number, number];
  onClick: () => void;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ userLocation, onClick }) => {
  // Create a pulsing blue dot icon for user location
  const createUserLocationIcon = () => {
    return L.divIcon({
      className: 'user-location-marker',
      html: `<div class="pulse-dot"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };
  
  return (
    <Marker 
      position={userLocation} 
      icon={createUserLocationIcon()}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-medium">Your Location</h3>
          <p className="text-xs text-gray-600 mt-1">
            {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

export default UserLocationMarker;

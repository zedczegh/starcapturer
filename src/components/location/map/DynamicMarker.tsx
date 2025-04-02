
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { createCustomMarker } from './MapComponents';

interface DynamicMarkerProps {
  position: [number, number];
  popup?: string;
  color?: string;
}

const DynamicMarker: React.FC<DynamicMarkerProps> = ({ 
  position, 
  popup,
  color = '#3b82f6' // Default blue color
}) => {
  // Create custom marker with the specified color
  const icon = createCustomMarker(color);
  
  return (
    <Marker position={position} icon={icon}>
      {popup && (
        <Popup>
          {popup}
        </Popup>
      )}
    </Marker>
  );
};

export default DynamicMarker;

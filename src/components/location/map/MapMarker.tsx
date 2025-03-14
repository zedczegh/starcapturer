
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { formatCoordinates } from '@/utils/coordinates';

// Custom map marker with enhanced styling
const CustomIcon = L.divIcon({
  className: 'custom-map-marker',
  html: `<div class="marker-pin animate-pulse-subtle">
           <div class="marker-pin-inner"></div>
         </div>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42]
});

interface MapMarkerProps {
  position: [number, number];
  locationName: string;
  showPopup?: boolean;
}

const MapMarker: React.FC<MapMarkerProps> = ({ 
  position, 
  locationName, 
  showPopup = true 
}) => {
  return (
    <Marker position={position} icon={CustomIcon}>
      {showPopup && (
        <Popup>
          <div className="text-slate-800 font-medium">
            {locationName || formatCoordinates(position[0], position[1])}
          </div>
        </Popup>
      )}
    </Marker>
  );
};

export default React.memo(MapMarker);

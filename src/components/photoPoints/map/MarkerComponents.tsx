
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { SharedAstroSpot } from '@/types/weather';
import MapMarkerPopup from './MapMarkerPopup';
import LocationPopupContent from './LocationPopupContent';

interface MarkerComponentProps {
  location: SharedAstroSpot;
  realTimeSiqs: number | null;
  isUserMarker: boolean;
  isCertified: boolean;
  icon: L.Icon;
  isHovered: boolean;
  onMarkerClick: (location: SharedAstroSpot) => void;
  onMarkerHover: (id: string | null) => void;
  isMobile: boolean;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  displayName: string;
  siqsScore: number | null;
}

export const LocationMarkerComponent: React.FC<MarkerComponentProps> = ({
  location,
  realTimeSiqs,
  isUserMarker,
  isCertified,
  icon,
  isHovered,
  onMarkerClick,
  onMarkerHover,
  isMobile,
  handleTouchStart,
  handleTouchEnd,
  displayName,
  siqsScore
}) => {
  const handleClick = () => {
    onMarkerClick(location);
  };

  const handleMouseOver = () => {
    if (location.id) {
      onMarkerHover(location.id);
    }
  };

  const handleMouseOut = () => {
    onMarkerHover(null);
  };

  const handleTouchStartEvent = (e: React.TouchEvent) => {
    if (handleTouchStart && location.id) {
      handleTouchStart(e, location.id);
    }
  };

  const handleTouchEndEvent = (e: React.TouchEvent) => {
    if (handleTouchEnd && location.id) {
      handleTouchEnd(e, null);
    }
  };

  // Create a default icon if none provided
  const markerIcon = icon || new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={markerIcon}
      eventHandlers={{
        click: handleClick,
        mouseover: handleMouseOver,
        mouseout: handleMouseOut
      }}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-medium text-base">{displayName}</h3>
          {siqsScore !== null && (
            <div className="mt-1">SIQS Score: {siqsScore.toFixed(1)}</div>
          )}
          <button 
            className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs"
            onClick={handleClick}
          >
            View Details
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

interface UserMarkerProps {
  position: [number, number];
  icon?: L.Icon;
  children?: React.ReactNode;
}

export const UserMarkerComponent: React.FC<UserMarkerProps> = ({ position, icon, children }) => {
  // Create a default user icon if none provided
  const userIcon = icon || new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
  
  return (
    <Marker position={position} icon={userIcon}>
      {children}
    </Marker>
  );
};

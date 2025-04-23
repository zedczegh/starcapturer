
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsScore } from '@/utils/siqsHelpers';

// Import existing marker icons and styles here
import './MarkerStyles.css';

// Icon URLs (these should be imported from your existing code)
const regularIconUrl = 'https://cdn.lovable.ai/siqs-app/marker-regular.png';
const hoveredIconUrl = 'https://cdn.lovable.ai/siqs-app/marker-hover.png';
const certifiedIconUrl = 'https://cdn.lovable.ai/siqs-app/marker-certified.png';
const certifiedHoveredIconUrl = 'https://cdn.lovable.ai/siqs-app/marker-certified-hover.png';

const createIcon = (url: string, className = '') => {
  return L.icon({
    iconUrl: url,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
    className
  });
};

// Helper function to get SIQS color class
const getSiqsColorClass = (siqs: number): string => {
  if (siqs >= 7.5) return 'excellent';
  if (siqs >= 6.0) return 'good';
  if (siqs >= 4.5) return 'average';
  if (siqs >= 3.0) return 'poor';
  return 'bad';
};

interface LocationMarkerProps {
  location: SharedAstroSpot;
  onClick?: (location: SharedAstroSpot) => void;
  isHovered?: boolean;
  onHover?: (id: string | null) => void;
  locationId: string;
  isCertified?: boolean;
  activeView?: 'certified' | 'calculated';
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  customPopup?: (location: any) => React.ReactNode;
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({
  location,
  onClick,
  isHovered = false,
  onHover,
  locationId,
  isCertified = false,
  activeView = 'calculated',
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  customPopup
}) => {
  const siqsClass = getSiqsColorClass(getSiqsScore(location?.siqs || 0));
  
  // For certified locations, use certified icons
  const regularIcon = isCertified 
    ? createIcon(certifiedIconUrl, `marker ${siqsClass}`) 
    : createIcon(regularIconUrl, `marker ${siqsClass}`);
    
  const hoveredIcon = isCertified 
    ? createIcon(certifiedHoveredIconUrl, `marker hovered ${siqsClass}`) 
    : createIcon(hoveredIconUrl, `marker hovered ${siqsClass}`);
  
  const icon = isHovered ? hoveredIcon : regularIcon;

  const handleMarkerClick = () => {
    if (onClick) onClick(location);
  };
  
  const handleMouseOver = () => {
    if (onHover) onHover(locationId);
  };
  
  const handleMouseOut = () => {
    if (onHover) onHover(null);
  };
  
  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
      // In react-leaflet, event handlers are passed via 'eventHandlers' prop
      eventHandlers={{
        click: handleMarkerClick,
        mouseover: handleMouseOver,
        mouseout: handleMouseOut,
      }}
    >
      {customPopup ? (
        customPopup(location)
      ) : (
        <Popup>
          <div>
            <h3>{location.name}</h3>
            <p>{location.description}</p>
          </div>
        </Popup>
      )}
      <div
        onTouchStart={(e) => handleTouchStart && handleTouchStart(e, locationId)}
        onTouchEnd={(e) => handleTouchEnd && handleTouchEnd(e, locationId)}
        onTouchMove={handleTouchMove}
        className="marker-touch-target"
      />
    </Marker>
  );
};

interface UserLocationMarkerProps {
  position: [number, number];
  currentSiqs: number | null;
}

export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ position, currentSiqs }) => {
  const userIcon = L.divIcon({
    className: 'user-location-marker',
    html: `
      <div class="pulse"></div>
      <div class="dot"></div>
      ${currentSiqs ? `<div class="siqs-bubble">${currentSiqs.toFixed(1)}</div>` : ''}
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return <Marker position={position} icon={userIcon} />;
};

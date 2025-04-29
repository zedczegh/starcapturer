
import React from 'react';
import { Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { User } from 'lucide-react';
import MarkerPopupContent from './MapMarkerPopup';
import { SharedAstroSpot } from '@/types/weather';

// Import custom marker icons
import { getCertifiedLocationIcon, getCalculatedLocationIcon, getDarkSkyLocationIcon, getForecastLocationIcon } from './MarkerUtils';
import './MarkerStyles.css';

interface LocationMarkerProps {
  location: SharedAstroSpot;
  onClick?: (location: SharedAstroSpot) => void;
  isHovered?: boolean;
  onHover?: (id: string | null) => void;
  locationId: string;
  isCertified?: boolean;
  activeView: 'certified' | 'calculated';
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
  isForecast?: boolean;
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({
  location,
  onClick,
  isHovered = false,
  onHover,
  locationId,
  isCertified = false,
  activeView,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove,
  isForecast = false
}) => {
  const { latitude, longitude } = location;
  
  // Get the appropriate icon based on location type and hover state
  const getIcon = () => {
    if (isForecast || location.isForecast) {
      return getForecastLocationIcon(isHovered);
    }
    if (location.isDarkSkyReserve) {
      return getDarkSkyLocationIcon(isHovered);
    }
    if (isCertified || activeView === 'certified') {
      return getCertifiedLocationIcon(isHovered);
    }
    return getCalculatedLocationIcon(isHovered);
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick(location);
    }
  };

  const handleMouseOver = () => {
    if (onHover) {
      onHover(locationId);
    }
  };

  const handleMouseOut = () => {
    if (onHover) {
      onHover(null);
    }
  };
  
  return (
    <Marker
      position={[latitude, longitude]}
      icon={getIcon()}
      onClick={handleClick}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      <Popup>
        <div 
          onTouchStart={(e) => handleTouchStart && handleTouchStart(e, locationId)}
          onTouchEnd={(e) => handleTouchEnd && handleTouchEnd(e, null)}
          onTouchMove={handleTouchMove}
        >
          <MarkerPopupContent location={location} onClick={onClick} isForecast={isForecast || location.isForecast} />
        </div>
      </Popup>
      
      {isHovered && (
        <Circle
          center={[latitude, longitude]}
          pathOptions={{
            color: (isForecast || location.isForecast) ? '#8B5CF6' : '#3B82F6',
            fillColor: (isForecast || location.isForecast) ? '#C4B5FD' : '#93C5FD',
            fillOpacity: 0.15,
            weight: 2,
          }}
          radius={500}
        />
      )}
    </Marker>
  );
};

interface UserLocationMarkerProps {
  position: [number, number];
  currentSiqs?: number | null;
}

export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ 
  position,
  currentSiqs = null
}) => {
  const userIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div class="user-marker-container">
        <div class="user-marker-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        ${currentSiqs !== null ? `<div class="user-marker-siqs">${currentSiqs.toFixed(1)}</div>` : ''}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  return (
    <Marker position={position} icon={userIcon}>
      <Popup>
        <div className="text-sm p-1">
          <div className="font-semibold mb-1">Your Location</div>
          <div className="text-xs opacity-75">
            {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </div>
          {currentSiqs !== null && (
            <div className="mt-2 font-medium">
              SIQS: <span className="text-blue-600">{currentSiqs.toFixed(1)}</span>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

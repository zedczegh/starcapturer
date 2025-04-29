
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

  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
        mouseover: handleMouseOver,
        mouseout: handleMouseOut
      }}
    >
      <Popup>
        <LocationPopupContent
          location={location}
          realTimeSiqs={realTimeSiqs}
          isCertified={isCertified}
          displayName={displayName}
          siqsScore={siqsScore}
          onViewDetails={() => onMarkerClick(location)}
        />
      </Popup>
    </Marker>
  );
};

interface UserMarkerProps {
  position: [number, number];
  icon: L.Icon;
  children?: React.ReactNode;
}

export const UserMarkerComponent: React.FC<UserMarkerProps> = ({ position, icon, children }) => {
  return (
    <Marker position={position} icon={icon}>
      {children}
    </Marker>
  );
};

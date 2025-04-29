
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { createCustomIcon } from './MarkerUtils';
import SiqsDisplay from './SiqsDisplay';

interface LocationMarkerProps {
  location: SharedAstroSpot;
  onClick: (location: SharedAstroSpot) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onTouchStart: (e: React.TouchEvent, id: string) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  isMobile: boolean;
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({
  location,
  onClick,
  isHovered,
  onHover,
  onTouchStart,
  onTouchEnd,
  onTouchMove,
  isMobile
}) => {
  const { id, latitude, longitude, name, siqs, isDarkSkyReserve, certification } = location;
  
  // Create icon based on location type and SIQS
  const icon = createCustomIcon(location, isHovered);
  
  // Handle location click
  const handleClick = () => {
    onClick(location);
  };
  
  // Handle mouse events
  const handleMouseOver = () => {
    onHover(id);
  };
  
  const handleMouseOut = () => {
    onHover(null);
  };
  
  // Touch event handlers for mobile
  const handleTouchStartEvent = (e: React.TouchEvent) => {
    onTouchStart(e, id);
  };
  
  const handleTouchEndEvent = (e: React.TouchEvent) => {
    onTouchEnd(e);
  };
  
  const handleTouchMoveEvent = (e: React.TouchEvent) => {
    onTouchMove(e);
  };
  
  return (
    <Marker 
      position={[latitude, longitude]} 
      icon={icon}
      onClick={handleClick}
      eventHandlers={{
        mouseover: handleMouseOver,
        mouseout: handleMouseOut
      }}
    >
      <Popup>
        <div 
          className="p-2 min-w-[200px]"
          onTouchStart={handleTouchStartEvent}
          onTouchEnd={handleTouchEndEvent}
          onTouchMove={handleTouchMoveEvent}
        >
          <h3 className="font-medium text-base">{name || 'Unnamed Location'}</h3>
          {(isDarkSkyReserve || certification) && (
            <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium mt-1">
              {isDarkSkyReserve ? 'Dark Sky Reserve' : certification}
            </div>
          )}
          <SiqsDisplay siqs={siqs || 0} showLabel={true} className="mt-2" />
          <p className="text-xs text-gray-600 mt-1">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

export default LocationMarker;

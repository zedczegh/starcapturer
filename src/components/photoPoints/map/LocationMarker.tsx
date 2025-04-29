
import React, { useCallback } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { createCustomIcon } from './MarkerUtils';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsColorClass } from '@/utils/mapSiqsDisplay';
import MapMarkerPopup from './MapMarkerPopup';

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
}

const LocationMarker: React.FC<LocationMarkerProps> = ({
  location,
  onClick,
  isHovered,
  onHover,
  locationId,
  isCertified = false,
  activeView,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove
}) => {
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(location);
    }
  }, [onClick, location]);

  const handleMouseOver = useCallback(() => {
    if (onHover) {
      onHover(locationId);
    }
  }, [onHover, locationId]);

  const handleMouseOut = useCallback(() => {
    if (onHover) {
      onHover(null);
    }
  }, [onHover]);

  if (!location.latitude || !location.longitude) {
    return null;
  }

  // Use a special icon for forecast locations
  const isForecast = Boolean(location.isForecast);
  
  // Get color class based on SIQS or use default
  const colorClass = location.siqs 
    ? getSiqsColorClass(location.siqs) 
    : 'bg-primary';
  
  // Create icon based on location type
  const icon = createCustomIcon({
    isHovered,
    isCertified,
    isDarkSkyReserve: location.isDarkSkyReserve,
    siqs: location.siqs,
    isForecast,
    forecastDay: location.forecastDay
  });

  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
        mouseover: handleMouseOver,
        mouseout: handleMouseOut,
        touchstart: (e) => handleTouchStart && handleTouchStart(e, locationId),
        touchend: (e) => handleTouchEnd && handleTouchEnd(e, locationId),
        touchmove: handleTouchMove
      }}
    >
      <Popup>
        <MapMarkerPopup 
          location={location} 
          onClick={handleClick}
          isForecast={isForecast}
        />
      </Popup>
    </Marker>
  );
};

export default LocationMarker;

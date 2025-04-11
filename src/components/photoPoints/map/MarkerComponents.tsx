
import React, { useMemo } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { formatSIQSScoreForDisplay } from '@/hooks/siqs/siqsCalculationUtils';

// User location marker component
export const UserLocationMarker: React.FC<{
  position: [number, number];
  currentSiqs: number | null;
}> = ({ position, currentSiqs }) => {
  // Create icon for user location marker
  const userIcon = useMemo(() => {
    return L.divIcon({
      className: 'user-location-marker',
      html: `<div class="marker-pulse"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }, []);
  
  return (
    <Marker
      position={position}
      icon={userIcon}
      zIndexOffset={1000}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent>
        <div className="text-xs">
          {currentSiqs !== null 
            ? `SIQS: ${formatSIQSScoreForDisplay(currentSiqs)}` 
            : 'Your Location'}
        </div>
      </Tooltip>
    </Marker>
  );
};

// Location marker component
export const LocationMarker: React.FC<{
  location: SharedAstroSpot;
  onClick: () => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  locationId: string;
  isCertified: boolean;
}> = ({ location, onClick, isHovered, onHover, locationId, isCertified }) => {
  // Create icon for location marker based on certification and SIQS
  const locationIcon = useMemo(() => {
    const isCertifiedLocation = Boolean(location.certification || location.isDarkSkyReserve);
    const siqsValue = location.siqsResult?.score ?? location.siqs ?? 0;
    
    // Calculate marker size and class
    let iconClass = 'location-marker';
    let size = 22;
    
    if (isCertifiedLocation) {
      iconClass += ' certified-location';
      size = 28;
    } else if (siqsValue >= 7) {
      iconClass += ' high-siqs-location';
      size = 24;
    } else if (siqsValue >= 5) {
      iconClass += ' medium-siqs-location';
      size = 22;
    } else {
      iconClass += ' low-siqs-location';
      size = 20;
    }
    
    if (isHovered) {
      iconClass += ' hovered';
      size += 4;
    }
    
    return L.divIcon({
      className: iconClass,
      html: `<div class="inner-marker${isHovered ? ' hovered' : ''}"></div>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  }, [location, isHovered]);
  
  // Generate display name
  const displayName = useMemo(() => {
    if (location.certification || location.isDarkSkyReserve) {
      return location.name || 'Dark Sky Site';
    }
    return location.name || `Location at ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  }, [location]);
  
  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={locationIcon}
      eventHandlers={{
        click: onClick,
        mouseover: () => onHover(locationId),
        mouseout: () => onHover(null)
      }}
      zIndexOffset={isHovered ? 900 : (location.certification ? 800 : 500)}
    >
      <Popup>
        <div>
          <h3 className="font-medium">{displayName}</h3>
          {location.siqs && (
            <p className="text-sm">SIQS: {formatSIQSScoreForDisplay(location.siqs)}</p>
          )}
          {location.distance && (
            <p className="text-sm">
              Distance: {location.distance < 100 
                ? `${Math.round(location.distance)} km` 
                : `${Math.round(location.distance / 10) * 10} km`}
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

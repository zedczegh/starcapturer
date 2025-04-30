import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, MapPin } from "lucide-react";
import { formatDistance } from "@/utils/formatters";
import { formatSiqsScore } from "@/utils/siqsHelpers";
import { getLocationMarker } from './MarkerUtils';
import MarkerEventHandler from './MarkerEventHandler';
import { getSiqsScore } from '@/utils/siqsHelpers';

// Create custom marker icons
const createMarkerIcon = (isActive: boolean = false, isCertified: boolean = false) => {
  const iconUrl = isCertified 
    ? (isActive ? '/certified-marker-active.png' : '/certified-marker.png') 
    : (isActive ? '/marker-active.png' : '/marker.png');
  
  // Fallback to default markers if icon files not found
  return new L.Icon({
    iconUrl: iconUrl,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32]
  });
};

/**
 * Marker for certified dark sky locations with special styling
 */
export const CertifiedLocationMarker = React.memo(({
  location, 
  onClick,
  onHover,
  isHovered
}: {
  location: SharedAstroSpot;
  onClick: (location: SharedAstroSpot) => void;
  onHover: (id: string | null) => void;
  isHovered: boolean;
}) => {
  const { t } = useLanguage();
  const icon = getLocationMarker(location, true, isHovered, false);
  const locationId = location.id || `${location.latitude}-${location.longitude}`;
  
  const handleClick = () => onClick(location);
  const handleMouseOver = () => onHover(locationId);
  const handleMouseOut = () => onHover(null);
  
  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
    >
      <MarkerEventHandler 
        marker={null}
        eventMap={{
          click: handleClick,
          mouseover: handleMouseOver,
          mouseout: handleMouseOut
        }}
      />
      <Popup>
        <div className="flex flex-col">
          <div className="font-semibold">{location.name}</div>
          <div className="text-xs text-muted-foreground">
            {location.distance ? formatDistance(location.distance) : ''}
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

/**
 * Marker for calculated (non-certified) locations
 */
export const CalculatedLocationMarker = React.memo(({
  location, 
  onClick,
  onHover,
  isHovered
}: {
  location: SharedAstroSpot;
  onClick: (location: SharedAstroSpot) => void;
  onHover: (id: string | null) => void;
  isHovered: boolean;
}) => {
  const { t } = useLanguage();
  const icon = getLocationMarker(location, false, isHovered, false);
  const locationId = location.id || `${location.latitude}-${location.longitude}`;
  
  const handleClick = () => onClick(location);
  const handleMouseOver = () => onHover(locationId);
  const handleMouseOut = () => onHover(null);
  
  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
    >
      <MarkerEventHandler 
        marker={null}
        eventMap={{
          click: handleClick,
          mouseover: handleMouseOver,
          mouseout: handleMouseOut
        }}
      />
      <Popup>
        <div className="flex flex-col">
          <div className="font-semibold">{location.name}</div>
          <div className="text-xs text-muted-foreground">
            {location.distance ? formatDistance(location.distance) : ''}
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

/**
 * Marker for user's current location
 */
export const UserLocationMarker = React.memo(({
  position,
  onClick
}: {
  position: [number, number];
  onClick?: () => void;
}) => {
  const handleClick = onClick || (() => {});
  
  const icon = new L.Icon({
    iconUrl: '/user-location.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
  
  return (
    <Marker
      position={position}
      icon={icon}
    >
      <MarkerEventHandler 
        marker={null}
        eventMap={{
          click: handleClick
        }}
      />
      <Popup>
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-blue-500" />
          <span className="font-medium">Your Location</span>
        </div>
      </Popup>
    </Marker>
  );
});

export const LocationMarker: React.FC<{
  location: SharedAstroSpot;
  isActive: boolean;
  onClick: (location: SharedAstroSpot) => void;
  onMouseOver?: (id: string) => void;
  onMouseOut?: (id: string) => void;
}> = ({ location, isActive, onClick, onMouseOver, onMouseOut }) => {
  const { t } = useLanguage();
  const isCertified = !!location.isDarkSkyReserve || !!location.certification;
  
  const icon = createMarkerIcon(isActive, isCertified);
  
  const handleClick = () => {
    onClick(location);
  };
  
  const handleMouseOver = () => {
    if (onMouseOver && location.id) {
      onMouseOver(location.id);
    }
  };
  
  const handleMouseOut = () => {
    if (onMouseOut && location.id) {
      onMouseOut(location.id);
    }
  };
  
  return (
    <Marker 
      position={[location.latitude, location.longitude]} 
      icon={icon}
      onClick={handleClick} 
      onMouseover={handleMouseOver}
      onMouseout={handleMouseOut}
    >
      <Popup>
        <div className="flex flex-col">
          <div className="font-semibold">{location.name}</div>
          <div className="text-xs text-muted-foreground">
            {location.distance ? formatDistance(location.distance) : ''}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export const ForecastMarker: React.FC<{
  location: SharedAstroSpot;
  isActive: boolean;
  onClick: (location: SharedAstroSpot) => void;
  onMouseOver?: (id: string) => void;
  onMouseOut?: (id: string) => void;
}> = ({ location, isActive, onClick, onMouseOver, onMouseOut }) => {
  const { t } = useLanguage();
  
  const icon = new L.Icon({
    iconUrl: isActive ? '/forecast-marker-active.png' : '/forecast-marker.png',
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32]
  });
  
  const handleClick = () => {
    onClick(location);
  };
  
  const handleMouseOver = () => {
    if (onMouseOver && location.id) {
      onMouseOver(location.id);
    }
  };
  
  const handleMouseOut = () => {
    if (onMouseOut && location.id) {
      onMouseOut(location.id);
    }
  };
  
  return (
    <Marker 
      position={[location.latitude, location.longitude]} 
      icon={icon}
      onClick={handleClick}
      onMouseover={handleMouseOver}
      onMouseout={handleMouseOut}
    >
      <Popup>
        <div className="flex flex-col">
          <div className="font-semibold">{location.name}</div>
          {location.forecastDate && (
            <div className="text-xs flex items-center text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              {location.forecastDate}
            </div>
          )}
          {typeof location.cloudCover === 'number' && (
            <div className="text-xs text-muted-foreground">
              {t("Cloud cover", "云量")}: {Math.round(location.cloudCover * 100)}%
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {location.distance ? formatDistance(location.distance) : ''}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

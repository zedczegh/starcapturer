
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { MapPin, Star, Calendar } from 'lucide-react';
import { getSiqsScore, formatSiqs } from '@/utils/siqsHelpers';
import { formatDistance } from '@/utils/formatters';
import L from 'leaflet';
import MarkerEventHandler from './MarkerEventHandler';

interface ForecastMarkerProps {
  location: SharedAstroSpot;
  onClick: () => void;
  onHover?: () => void;
  onMouseOut?: () => void;
  showTooltip?: boolean;
  isHovered?: boolean;
  locationId?: string;
  forecastDay?: number;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
}

export const ForecastMarker: React.FC<ForecastMarkerProps> = ({
  location,
  onClick,
  onHover,
  onMouseOut,
  showTooltip = true,
  isHovered = false,
  locationId = '',
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove
}) => {
  const { t, language } = useLanguage();
  const siqsScore = getSiqsScore(location.siqs);
  const formattedSiqs = formatSiqs(siqsScore);
  
  // Create custom icon for forecast markers
  const icon = L.divIcon({
    className: `forecast-marker ${siqsScore > 7 ? 'high-quality' : siqsScore > 5 ? 'medium-quality' : 'low-quality'}`,
    html: `<div class="forecast-marker-inner ${isHovered ? 'hovered' : ''}">
      <div class="forecast-marker-label">${formattedSiqs}</div>
    </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
  
  return (
    <Marker 
      position={[location.latitude, location.longitude]} 
      icon={icon}
      eventHandlers={{
        click: onClick,
        mouseover: onHover,
        mouseout: onMouseOut
      }}
    >
      <MarkerEventHandler 
        marker={null}
        eventMap={{
          mouseover: onHover,
          mouseout: onMouseOut,
          touchstart: handleTouchStart ? (e) => handleTouchStart(e, locationId) : undefined,
          touchend: handleTouchEnd ? (e) => handleTouchEnd(e, locationId) : undefined,
          touchmove: handleTouchMove
        }}
      />
      
      {showTooltip && (
        <Popup>
          <div className="p-2 forecast-popup">
            <div className="font-medium mb-1">{location.name}</div>
            
            {location.forecastDate && (
              <div className="text-xs flex items-center mb-1">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{location.forecastDate}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="h-3.5 w-3.5 text-yellow-400 mr-1" fill="#facc15" />
                <span className="text-sm font-medium">{formattedSiqs}</span>
              </div>
              
              {location.distance && (
                <div className="text-xs text-muted-foreground">
                  {formatDistance(location.distance)}
                </div>
              )}
            </div>
            
            {location.cloudCover !== undefined && (
              <div className="text-xs mt-1">
                {t("Cloud cover", "云量")}: {Math.round(location.cloudCover)}%
              </div>
            )}
          </div>
        </Popup>
      )}
    </Marker>
  );
};

interface LocationMarkerProps {
  location: SharedAstroSpot;
  onClick: () => void;
  onHover?: () => void;
  onMouseOut?: () => void;
  isHovered?: boolean;
  locationId?: string;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({
  location,
  onClick,
  onHover,
  onMouseOut,
  isHovered = false,
  locationId = '',
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove
}) => {
  const { t } = useLanguage();
  const siqsScore = getSiqsScore(location.siqs);
  const formattedSiqs = formatSiqs(siqsScore);
  
  // Create marker icon based on SIQS score
  const icon = L.divIcon({
    className: `location-marker ${siqsScore > 7 ? 'high-quality' : siqsScore > 5 ? 'medium-quality' : 'low-quality'}`,
    html: `<div class="location-marker-inner ${isHovered ? 'hovered' : ''}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
  
  return (
    <Marker 
      position={[location.latitude, location.longitude]} 
      icon={icon}
      eventHandlers={{
        click: onClick,
        mouseover: onHover,
        mouseout: onMouseOut
      }}
    >
      <MarkerEventHandler 
        marker={null}
        eventMap={{
          mouseover: onHover,
          mouseout: onMouseOut,
          touchstart: handleTouchStart ? (e) => handleTouchStart(e, locationId) : undefined,
          touchend: handleTouchEnd ? (e) => handleTouchEnd(e, locationId) : undefined,
          touchmove: handleTouchMove
        }}
      />
      
      <Popup>
        <div className="p-2">
          <div className="font-medium mb-1">{location.name}</div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Star className="h-3.5 w-3.5 text-yellow-400 mr-1" fill="#facc15" />
              <span className="text-sm font-medium">{formattedSiqs}</span>
            </div>
            
            {location.distance && (
              <div className="text-xs text-muted-foreground">
                {formatDistance(location.distance)}
              </div>
            )}
          </div>
          
          <div className="text-xs mt-1">
            <MapPin className="h-3 w-3 inline mr-1" />
            {t("View details", "查看详情")}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

interface UserLocationMarkerProps {
  position: [number, number];
  currentSiqs?: number | null;
}

export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ 
  position,
  currentSiqs
}) => {
  const { t } = useLanguage();
  
  const icon = L.divIcon({
    className: 'user-location-marker',
    html: `<div class="user-location-marker-inner"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
  
  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <div className="p-2">
          <div className="font-medium mb-1">{t("Your Location", "您的位置")}</div>
          <div className="text-xs">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </div>
          {currentSiqs !== null && currentSiqs !== undefined && (
            <div className="flex items-center mt-1">
              <Star className="h-3.5 w-3.5 text-yellow-400 mr-1" fill="#facc15" />
              <span className="text-sm">{formatSiqs(currentSiqs)}</span>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

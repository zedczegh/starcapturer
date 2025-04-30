
import React, { useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSiqsClass, getCertificationColor, getLocationColor, shouldShowLocationMarker } from '@/utils/markerUtils';
import { formatDistance } from '@/utils/formatters';
import { formatSiqs } from '@/utils/siqsHelpers';

// User location marker with SIQS score
export const UserLocationMarker = ({ 
  position, 
  currentSiqs = null 
}: { 
  position: [number, number]; 
  currentSiqs: number | null;
}) => {
  const { t } = useLanguage();
  const hasScore = currentSiqs !== null;
  
  const userIcon = L.divIcon({
    className: `user-location-marker ${hasScore ? getSiqsClass(currentSiqs) : ''}`,
    html: `
      <div class="pulse-circle"></div>
      <div class="center-dot ${hasScore ? 'with-score' : ''}">
        ${hasScore ? `<span>${formatSiqs(currentSiqs)}</span>` : ''}
      </div>
    `,
    iconSize: [hasScore ? 36 : 28, hasScore ? 36 : 28],
    iconAnchor: [hasScore ? 18 : 14, hasScore ? 18 : 14],
  });

  return (
    <Marker position={position} icon={userIcon}>
      <Popup className="location-popup">
        <div>
          <h4 className="text-sm font-medium">{t("Your Location", "您的位置")}</h4>
          {currentSiqs !== null && (
            <p className="text-xs mt-1">
              {t("Current SIQS:", "当前SIQS：")} <span className="font-medium">{formatSiqs(currentSiqs)}</span>
            </p>
          )}
          <p className="text-2xs text-muted-foreground mt-1">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

// Standard location marker
export const LocationMarker = ({ 
  location, 
  onClick,
  isHovered,
  onHover,
  locationId,
  isCertified,
  activeView,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove
}: {
  location: SharedAstroSpot;
  onClick: (location: SharedAstroSpot) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  locationId: string;
  isCertified: boolean;
  activeView: 'certified' | 'calculated';
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
}) => {
  const { t } = useLanguage();
  const [popupOpen, setPopupOpen] = useState(false);
  
  if (!shouldShowLocationMarker(location, isCertified, activeView)) {
    return null;
  }
  
  const locationName = location.name || 
    (isCertified ? t("Protected Dark Sky Area", "受保护的黑暗天空区") : t("Dark Sky Location", "黑暗天空地点"));
  
  const markerColor = getLocationColor(location);
  
  const iconType = isCertified ? 'star-marker' : 'circle-marker';
  const siqsClass = getSiqsClass(location.siqs) || '';
  
  const markerIcon = L.divIcon({
    className: `location-marker ${iconType} ${siqsClass} ${isHovered || popupOpen ? 'hovered' : ''}`,
    html: `<div style="background-color: ${markerColor};"></div>`,
    iconSize: [isCertified ? 26 : 20, isCertified ? 26 : 20],
    iconAnchor: [isCertified ? 13 : 10, isCertified ? 13 : 10],
  });
  
  const handleClick = () => {
    onClick(location);
  };
  
  const handleMouseOver = () => {
    onHover(locationId);
  };
  
  const handleMouseOut = () => {
    onHover(null);
  };
  
  const handlePopupOpen = () => {
    setPopupOpen(true);
  };
  
  const handlePopupClose = () => {
    setPopupOpen(false);
  };
  
  return (
    <Marker 
      position={[location.latitude, location.longitude]}
      icon={markerIcon}
      eventHandlers={{
        click: handleClick,
        mouseover: handleMouseOver,
        mouseout: handleMouseOut,
        popupopen: handlePopupOpen,
        popupclose: handlePopupClose,
      }}
    >
      <Popup className="location-popup">
        <div 
          onTouchStart={handleTouchStart ? (e) => handleTouchStart(e, locationId) : undefined}
          onTouchEnd={handleTouchEnd ? (e) => handleTouchEnd(e, null) : undefined}
          onTouchMove={handleTouchMove}
        >
          <h4 className="text-sm font-medium">{locationName}</h4>
          {location.siqs !== undefined && (
            <p className="text-xs mt-1">
              SIQS: <span className="font-medium">{formatSiqs(location.siqs)}</span>
            </p>
          )}
          {location.distance !== undefined && (
            <p className="text-xs">
              {t("Distance:", "距离:")} <span className="font-medium">{formatDistance(location.distance)}</span>
            </p>
          )}
          {isCertified && location.certification && (
            <p className="text-2xs text-muted-foreground mt-1">
              {location.certification}
            </p>
          )}
          <button 
            className="w-full mt-2 text-xs bg-primary/80 hover:bg-primary text-primary-foreground py-1 px-2 rounded transition-colors"
            onClick={handleClick}
          >
            {t("View Details", "查看详情")}
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

// New Forecast Marker Component
export const ForecastMarker = ({ 
  location, 
  onClick,
  isHovered,
  onHover,
  locationId,
  forecastDay,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove
}: {
  location: SharedAstroSpot;
  onClick: (location: SharedAstroSpot) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  locationId: string;
  forecastDay: number;
  handleTouchStart?: (e: React.TouchEvent, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent, id: string | null) => void;
  handleTouchMove?: (e: React.TouchEvent) => void;
}) => {
  const { t } = useLanguage();
  const [popupOpen, setPopupOpen] = useState(false);
  
  const locationName = location.name || t("Forecast Location", "预报位置");
  const siqsClass = getSiqsClass(location.siqs) || '';
  
  const dayLabel = forecastDay === 0 ? t("Today", "今天") : 
                   forecastDay === 1 ? t("Tomorrow", "明天") : 
                   `${t("Day", "天")} ${forecastDay + 1}`;
  
  // Make forecast markers diamond-shaped with animated border
  const markerIcon = L.divIcon({
    className: `forecast-marker ${siqsClass} ${isHovered || popupOpen ? 'hovered' : ''}`,
    html: `
      <div class="forecast-diamond ${siqsClass}">
        <div class="diamond-inner"></div>
        <div class="diamond-pulse"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
  
  const handleClick = () => {
    onClick(location);
  };
  
  const handleMouseOver = () => {
    onHover(locationId);
  };
  
  const handleMouseOut = () => {
    onHover(null);
  };
  
  const handlePopupOpen = () => {
    setPopupOpen(true);
  };
  
  const handlePopupClose = () => {
    setPopupOpen(false);
  };
  
  return (
    <Marker 
      position={[location.latitude, location.longitude]}
      icon={markerIcon}
      eventHandlers={{
        click: handleClick,
        mouseover: handleMouseOver,
        mouseout: handleMouseOut,
        popupopen: handlePopupOpen,
        popupclose: handlePopupClose,
      }}
    >
      <Popup className="forecast-popup">
        <div 
          onTouchStart={handleTouchStart ? (e) => handleTouchStart(e, locationId) : undefined}
          onTouchEnd={handleTouchEnd ? (e) => handleTouchEnd(e, null) : undefined}
          onTouchMove={handleTouchMove}
        >
          <h4 className="text-sm font-medium flex items-center">
            <span className="mr-1">{locationName}</span> 
            <span className="text-2xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-sm">
              {dayLabel}
            </span>
          </h4>
          
          {location.siqs !== undefined && (
            <p className="text-xs mt-1">
              {t("Forecast SIQS:", "预报SIQS：")} <span className="font-medium">{formatSiqs(location.siqs)}</span>
            </p>
          )}
          
          {location.cloudCover !== undefined && (
            <p className="text-xs">
              {t("Cloud Cover:", "云层覆盖：")} <span className="font-medium">{location.cloudCover}%</span>
            </p>
          )}
          
          {location.forecastDate && (
            <p className="text-2xs text-muted-foreground mt-1">
              {new Date(location.forecastDate).toLocaleDateString()}
            </p>
          )}
          
          <button 
            className="w-full mt-2 text-xs bg-primary/80 hover:bg-primary text-primary-foreground py-1 px-2 rounded transition-colors"
            onClick={handleClick}
          >
            {t("View Details", "查看详情")}
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

import React, { useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getProgressColor } from '@/components/siqs/utils/progressColor';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import { formatDistance } from '@/utils/geoUtils';
import { Star, Award, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isWaterLocation, isValidAstronomyLocation, isLikelyCoastalWater } from '@/utils/locationValidator';
import { useIsMobile } from '@/hooks/use-mobile';
import MarkerEventHandler from './MarkerEventHandler';
import { getSiqsClass, getCertificationColor } from '@/utils/markerUtils';

const isWaterSpot = (location: SharedAstroSpot): boolean => {
  if (location.isDarkSkyReserve || location.certification) {
    return false;
  }
  
  if (isWaterLocation(location.latitude, location.longitude, false)) {
    return true;
  }
  
  if (isLikelyCoastalWater(location.latitude, location.longitude)) {
    return true;
  }
  
  if (location.name) {
    const lowerName = location.name.toLowerCase();
    const waterKeywords = [
      'ocean', 'sea', 'bay', 'gulf', 'lake', 'strait', 
      'channel', 'sound', 'harbor', 'harbour', 'port', 
      'pier', 'marina', 'lagoon', 'reservoir', 'fjord', 
      'canal', 'pond', 'basin', 'cove', 'inlet', 'beach'
    ];
    
    for (const keyword of waterKeywords) {
      if (lowerName.includes(keyword)) {
        return true;
      }
    }
  }
  
  return false;
};

const getLocationMarker = (location: SharedAstroSpot, isCertified: boolean, isHovered: boolean, isMobile: boolean) => {
  const sizeMultiplier = isMobile ? 1.2 : 1.0;
  
  if (isCertified) {
    const certColor = getCertificationColor(location);
    return createCustomMarker(certColor, 'star', sizeMultiplier);
  } else {
    const defaultColor = '#4ADE80';
    const color = location.siqs ? getProgressColor(location.siqs) : defaultColor;
    return createCustomMarker(color, 'circle', sizeMultiplier);
  }
};

interface LocationMarkerProps {
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
}

const LocationMarker = memo(({ 
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
}: LocationMarkerProps) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const markerRef = useRef<L.Marker | null>(null);
  const isMobile = useIsMobile();
  
  if (activeView === 'certified' && !isCertified) {
    return null;
  }
  
  if (!isCertified) {
    if (isWaterSpot(location)) {
      return null;
    }
    
    if (!isValidAstronomyLocation(location.latitude, location.longitude, location.name)) {
      return null;
    }
  }
  
  const icon = useMemo(() => {
    return getLocationMarker(location, isCertified, isHovered, isMobile);
  }, [location, isCertified, isHovered, isMobile]);
  
  const handleClick = useCallback(() => {
    onClick(location);
  }, [location, onClick]);
  
  const handleMouseOver = useCallback(() => {
    onHover(locationId);
    
    const marker = markerRef.current;
    if (marker && marker.getElement()) {
      marker.getElement()?.classList.add('hovered');
    }
  }, [locationId, onHover]);
  
  const handleMouseOut = useCallback(() => {
    onHover(null);
    
    const marker = markerRef.current;
    if (marker && marker.getElement()) {
      marker.getElement()?.classList.remove('hovered');
    }
  }, [onHover]);
  
  const handleMarkerTouchStart = useCallback((e: TouchEvent) => {
    if (handleTouchStart) {
      const syntheticEvent = e as unknown as React.TouchEvent;
      handleTouchStart(syntheticEvent, locationId);
    }
    
    const marker = markerRef.current;
    if (marker && marker.getElement()) {
      marker.getElement()?.classList.add('hovered');
    }
  }, [locationId, handleTouchStart]);
  
  const handleMarkerTouchEnd = useCallback((e: TouchEvent) => {
    if (handleTouchEnd) {
      const syntheticEvent = e as unknown as React.TouchEvent;
      handleTouchEnd(syntheticEvent, locationId);
    }
  }, [locationId, handleTouchEnd]);
  
  const handleMarkerTouchMove = useCallback((e: TouchEvent) => {
    if (handleTouchMove) {
      const syntheticEvent = e as unknown as React.TouchEvent;
      handleTouchMove(syntheticEvent);
    }
  }, [handleTouchMove]);
  
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    
    let closeTimer: number | null = null;
    
    if (isHovered) {
      marker.openPopup();
      marker.getElement()?.classList.add('hovered');
      
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    } else {
      closeTimer = window.setTimeout(() => {
        marker.closePopup();
        marker.getElement()?.classList.remove('hovered');
      }, isMobile ? 4000 : 2000);
    }
    
    return () => {
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [isHovered, isMobile]);
  
  const displayName = language === 'zh' && location.chineseName 
    ? location.chineseName 
    : location.name;
  
  const siqsClass = getSiqsClass(location.siqs);
  
  const goToLocationDetails = () => {
    const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
    
    navigate(`/location/${locationId}`, {
      state: {
        id: locationId,
        name: location.name,
        chineseName: location.chineseName,
        latitude: location.latitude,
        longitude: location.longitude,
        bortleScale: location.bortleScale || 4,
        siqs: location.siqs,
        siqsResult: location.siqs ? { score: location.siqs } : undefined,
        certification: location.certification,
        isDarkSkyReserve: location.isDarkSkyReserve,
        timestamp: new Date().toISOString(),
        fromPhotoPoints: true
      }
    });
  };
  
  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
      ref={markerRef}
      onClick={handleClick}
    >
      <MarkerEventHandler 
        marker={markerRef.current}
        eventMap={{
          mouseover: handleMouseOver,
          mouseout: handleMouseOut,
          touchstart: handleMarkerTouchStart,
          touchend: handleMarkerTouchEnd,
          touchmove: handleMarkerTouchMove
        }}
      />
      
      <Popup 
        closeOnClick={false}
        autoClose={false}
        offset={[0, 10]}
        direction="bottom"
      >
        <div className={`py-2 px-0.5 max-w-[220px] leaflet-popup-custom-compact marker-popup-gradient ${siqsClass}`}>
          <div className="font-medium text-sm mb-1.5 flex items-center">
            {isCertified && (
              <Star className="h-3.5 w-3.5 mr-1 text-yellow-400 fill-yellow-400" />
            )}
            <span className="text-gray-100">{displayName}</span>
          </div>
          
          {isCertified && location.certification && (
            <div className="mt-1 text-xs font-medium text-amber-400 flex items-center">
              <Award className="h-3 w-3 mr-1" />
              {location.certification}
            </div>
          )}
          
          <div className="mt-2 flex items-center justify-between">
            {location.siqs !== undefined && (
              <div className="flex items-center gap-1.5">
                <SiqsScoreBadge score={location.siqs} compact={true} />
              </div>
            )}
            
            {location.distance && (
              <span className="text-xs text-gray-300 flex items-center justify-end">
                {formatDistance(location.distance)}
              </span>
            )}
          </div>
          
          <div className="mt-2 text-center">
            <button 
              onClick={goToLocationDetails}
              className={`text-xs flex items-center justify-center w-full bg-primary/20 hover:bg-primary/30 text-primary-foreground ${isMobile ? 'py-3' : 'py-1.5'} px-2 rounded transition-colors`}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {t("View Details", "查看详情")}
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

LocationMarker.displayName = 'LocationMarker';

const UserLocationMarker = memo(({ 
  position, 
  currentSiqs 
}: { 
  position: [number, number], 
  currentSiqs: number | null 
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  const userMarkerIcon = createCustomMarker('#e11d48', undefined, isMobile ? 1.2 : 1.0);
  
  return (
    <Marker position={position} icon={userMarkerIcon}>
      <Popup
        offset={[0, 10]}
        direction="bottom"
      >
        <div className="p-2 leaflet-popup-custom marker-popup-gradient">
          <strong>{t("Your Location", "您的位置")}</strong>
          <div className="text-xs mt-1">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </div>
          {currentSiqs !== null && (
            <div className="text-xs mt-1.5 flex items-center">
              <span className="mr-1">SIQS:</span>
              <SiqsScoreBadge score={currentSiqs} compact={true} />
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
});

UserLocationMarker.displayName = 'UserLocationMarker';

export { LocationMarker, UserLocationMarker };

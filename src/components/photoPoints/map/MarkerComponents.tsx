
import React, { useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { Star, Award, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import MarkerEventHandler from './MarkerEventHandler';
import { formatDistance } from '@/utils/geoUtils';
import { 
  getSiqsClass, 
  getLocationMarker, 
  isWaterSpot, 
  isValidAstronomyLocation
} from './MarkerUtils';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';

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
  
  const displayName = useMemo(() => {
    return language === 'zh' && location.chineseName 
      ? location.chineseName 
      : location.name || t("Unnamed Location", "未命名位置");
  }, [language, location.chineseName, location.name, t]);
    
  // Fix TS error by safely handling null siqsScore
  const siqsScore = location.siqs !== undefined && location.siqs !== null ? 
    (typeof location.siqs === 'number' ? location.siqs : (location.siqs as any)?.score || 0) : null;
  
  const siqsClass = getSiqsClass(siqsScore);
  
  // Don't show certified locations in calculated view unless they are actively displayed
  const shouldRender = useMemo(() => {
    // In certified view, only show certified locations
    if (activeView === 'certified') {
      return isCertified;
    }
    
    // In calculated view...
    // Always show certified locations if the location is certified
    if (isCertified) {
      return true; 
    }
    
    // For non-certified locations, filter out water
    if (isWaterSpot(location)) {
      return false;
    }
    
    if (!isValidAstronomyLocation(location.latitude, location.longitude, location.name)) {
      return false;
    }
    
    return true;
  }, [activeView, isCertified, location]);
  
  const icon = useMemo(() => {
    return getLocationMarker(location, isCertified, isHovered, isMobile);
  }, [location, isCertified, isHovered, isMobile]);
  
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
  
  const goToLocationDetails = useCallback(() => {
    const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
    
    // Handle the siqs value safely
    const siqsScore = location.siqs !== undefined && location.siqs !== null ?
      (typeof location.siqs === 'number' ? location.siqs : (location.siqs as any)?.score || 0) : null;
    
    const navigationData = {
      id: locationId,
      name: location.name || 'Unnamed Location',
      chineseName: location.chineseName || '',
      latitude: location.latitude,
      longitude: location.longitude,
      bortleScale: location.bortleScale || 4,
      siqs: location.siqs,
      timestamp: new Date().toISOString(),
      fromPhotoPoints: true,
      isDarkSkyReserve: Boolean(location.isDarkSkyReserve),
      certification: location.certification || '',
      siqsResult: location.siqs ? { 
        score: typeof location.siqs === 'number' ? location.siqs : (location.siqs as any)?.score || 0,
        isViable: typeof location.siqs === 'object' ? (location.siqs as any)?.isViable : (siqsScore !== null && siqsScore >= 2)
      } : undefined
    };
    
    navigate(`/location/${locationId}`, { 
      state: navigationData 
    });
  }, [location, navigate]);
  
  const handleClick = useCallback(() => {
    onClick(location);
  }, [location, onClick]);
  
  const handleMouseOver = useCallback(() => {
    onHover(locationId);
  }, [locationId, onHover]);
  
  const handleMouseOut = useCallback(() => {
    onHover(null);
  }, [onHover]);
  
  // Touch event handlers
  const handleMarkerTouchStart = useCallback((e: React.TouchEvent) => {
    if (handleTouchStart) {
      handleTouchStart(e, locationId);
    }
  }, [handleTouchStart, locationId]);
  
  const handleMarkerTouchEnd = useCallback((e: React.TouchEvent) => {
    if (handleTouchEnd) {
      handleTouchEnd(e, locationId);
    }
  }, [handleTouchEnd, locationId]);
  
  const handleMarkerTouchMove = useCallback((e: React.TouchEvent) => {
    if (handleTouchMove) {
      handleTouchMove(e);
    }
  }, [handleTouchMove]);
  
  if (!shouldRender) {
    return null;
  }
  
  if (!location.latitude || !location.longitude || 
      !isFinite(location.latitude) || !isFinite(location.longitude)) {
    console.error("Invalid location coordinates:", location);
    return null;
  }
  
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
              <Star className="h-3.5 w-3.5 mr-1 text-primary fill-primary" />
            )}
            <span className="text-gray-100">{displayName || t("Unnamed Location", "未命名位置")}</span>
          </div>
          
          {isCertified && location.certification && (
            <div className="mt-1 text-xs font-medium text-primary flex items-center">
              <Award className="h-3 w-3 mr-1" />
              {location.certification}
            </div>
          )}
          
          <div className="mt-2 flex items-center justify-between">
            {location.siqs !== undefined && location.siqs !== null && (
              <div className="flex items-center gap-1.5">
                <SiqsScoreBadge score={typeof location.siqs === 'number' ? location.siqs : (location.siqs as any)?.score || 0} compact={true} />
              </div>
            )}
            
            {typeof location.distance === 'number' && isFinite(location.distance) && (
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
  
  // Import and use createCustomMarker function
  const userMarkerIcon = createCustomMarker('#e11d48', 'circle', isMobile ? 1.2 : 1.0);
  
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

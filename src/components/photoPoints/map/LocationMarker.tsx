
import React, { useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsClass } from '@/utils/markerUtils';
import { formatDistance } from '@/utils/geoUtils';
import { Star, Award, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { prepareLocationForNavigation } from '@/utils/locationNavigation';
import { useIsMobile } from '@/hooks/use-mobile';
import MarkerEventHandler from './MarkerEventHandler';
import { getLocationMarker } from './markerUtils/markerIconGenerator';
import { shouldRenderLocation } from './markerUtils/locationValidator';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';

interface LocationMarkerProps {
  location: SharedAstroSpot;
  onClick: (location: SharedAstroSpot) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  locationId: string;
  isCertified: boolean;
  activeView: 'certified' | 'calculated';
  handleTouchStart?: (e: React.TouchEvent<Element>, id: string) => void;
  handleTouchEnd?: (e: React.TouchEvent<Element>) => void;
  handleTouchMove?: (e: React.TouchEvent<Element>) => void;
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
  
  const displayName = language === 'zh' && location.chineseName 
    ? location.chineseName 
    : location.name;
    
  const siqsClass = getSiqsClass(location.siqs);
  
  // Add debug logging for community markers
  useEffect(() => {
    if (isCertified && location.certification && location.certification.toLowerCase().includes('community')) {
      console.log("Rendering community:", location.name, "with certification:", location.certification);
    }
  }, [location, isCertified]);
  
  const shouldRender = useMemo(() => {
    return shouldRenderLocation(location, isCertified, activeView);
  }, [activeView, isCertified, location]);
  
  const icon = useMemo(() => {
    return getLocationMarker(location, isCertified, isHovered, isMobile);
  }, [location, isCertified, isHovered, isMobile]);
  
  // For debugging
  useEffect(() => {
    if (isCertified) {
      console.log(`Rendering certified location: ${location.name}, certification: ${location.certification}, isDarkSkyReserve: ${location.isDarkSkyReserve}, shouldRender: ${shouldRender}`);
    }
  }, [location, isCertified, shouldRender]);
  
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
      const syntheticEvent = e as unknown as React.TouchEvent<Element>;
      handleTouchStart(syntheticEvent, locationId);
    }
    
    const marker = markerRef.current;
    if (marker && marker.getElement()) {
      marker.getElement()?.classList.add('hovered');
    }
  }, [locationId, handleTouchStart]);
  
  const handleMarkerTouchEnd = useCallback((e: TouchEvent) => {
    if (handleTouchEnd) {
      const syntheticEvent = e as unknown as React.TouchEvent<Element>;
      handleTouchEnd(syntheticEvent);
    }
  }, [handleTouchEnd]);
  
  const handleMarkerTouchMove = useCallback((e: TouchEvent) => {
    if (handleTouchMove) {
      const syntheticEvent = e as unknown as React.TouchEvent<Element>;
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
  
  const goToLocationDetails = useCallback(() => {
    const navigationData = prepareLocationForNavigation(location);
    
    if (navigationData) {
      navigate(`/location/${navigationData.locationId}`, { 
        state: navigationData.locationState 
      });
    }
  }, [location, navigate]);
  
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
            {location.siqs !== undefined && (
              <div className="flex items-center gap-1.5">
                <SiqsScoreBadge score={location.siqs} compact={true} />
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

export default LocationMarker;

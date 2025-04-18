
import React, { useCallback, useRef, memo, useMemo, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { getSiqsClass, getLocationMarker } from '../MarkerUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import RealTimeSiqsFetcher from '../../cards/RealTimeSiqsFetcher';
import { getSiqsScore } from '@/utils/siqsHelpers';
import MarkerPopup from './MarkerPopup';

interface LocationMarkerProps {
  location: SharedAstroSpot;
  onClick: (location: SharedAstroSpot) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  locationId: string;
  isCertified: boolean;
  activeView: 'certified' | 'calculated';
}

const LocationMarker = memo(({ 
  location, 
  onClick,
  isHovered,
  onHover,
  locationId,
  isCertified,
  activeView,
}: LocationMarkerProps) => {
  const { language, t } = useLanguage();
  const markerRef = useRef<L.Marker | null>(null);
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [siqsLoading, setSiqsLoading] = useState(false);
  
  const displayName = useMemo(() => {
    if (language === 'zh' && location.chineseName) {
      return location.chineseName;
    }
    return location.name || t("Unnamed Location", "未命名位置");
  }, [language, location.chineseName, location.name, t]);
    
  const siqsScore = useMemo(() => {
    if (realTimeSiqs !== null) return realTimeSiqs;
    const locationSiqs = getSiqsScore(location);
    return locationSiqs > 0 ? locationSiqs : null;
  }, [location, realTimeSiqs]);
  
  const siqsClass = getSiqsClass(siqsScore);

  const handleSiqsCalculated = useCallback((siqs: number | null, loading: boolean) => {
    setRealTimeSiqs(siqs);
    setSiqsLoading(loading);
  }, []);
  
  const handleClick = useCallback(() => {
    setIsOpen(true);
    onClick(location);
  }, [location, onClick]);
  
  const handlePopupClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const icon = useMemo(() => {
    return getLocationMarker(location, isCertified, isHovered, isMobile);
  }, [location, isCertified, isHovered, isMobile]);

  if (!location.latitude || !location.longitude || 
      !isFinite(location.latitude) || !isFinite(location.longitude)) {
    console.error("Invalid location coordinates:", location);
    return null;
  }
  
  return (
    <>
      <RealTimeSiqsFetcher
        isVisible={isOpen}
        showRealTimeSiqs={true}
        latitude={location.latitude}
        longitude={location.longitude}
        bortleScale={location.bortleScale}
        onSiqsCalculated={handleSiqsCalculated}
      />
      
      <Marker
        position={[location.latitude, location.longitude]}
        icon={icon}
        ref={markerRef}
        // Use onClick, onMouseOver and onMouseOut instead of eventHandlers
        onClick={handleClick}
        onMouseOver={() => onHover(locationId)}
        onMouseOut={() => onHover(null)}
      >
        {isOpen && (
          <Popup 
            offset={[0, -5]}
            onClose={handlePopupClose}
          >
            <MarkerPopup
              location={location}
              siqsScore={siqsScore}
              siqsLoading={siqsLoading}
              siqsClass={siqsClass}
              displayName={displayName}
              isCertified={isCertified}
              onClose={handlePopupClose}
            />
          </Popup>
        )}
      </Marker>
    </>
  );
});

LocationMarker.displayName = 'LocationMarker';

export default LocationMarker;

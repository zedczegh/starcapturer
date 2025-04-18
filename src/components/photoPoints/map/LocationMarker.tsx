
import React, { useCallback, useState, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { Star, ExternalLink } from 'lucide-react';
import { formatDistance } from '@/utils/geoUtils';
import { getSiqsClass, getLocationMarker } from './MarkerUtils';
import RealTimeSiqsProvider from '../cards/RealTimeSiqsProvider';
import { getSiqsScore } from '@/utils/siqsHelpers';
import MarkerEventHandler from './MarkerEventHandler';

interface LocationMarkerProps {
  location: SharedAstroSpot;
  onClick: (location: SharedAstroSpot) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  locationId: string;
  isCertified: boolean;
  isMobile?: boolean;
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
  isCertified,
  isMobile = false,
  handleTouchStart,
  handleTouchEnd,
  handleTouchMove
}) => {
  const { language, t } = useLanguage();
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [siqsLoading, setSiqsLoading] = useState(false);
  const [siqsConfidence, setSiqsConfidence] = useState<number>(7);
  
  const displayName = useMemo(() => {
    if (language === 'zh' && location.chineseName) {
      return location.chineseName;
    }
    
    return location.name || t("Unnamed Location", "未命名位置");
  }, [language, location.chineseName, location.name, t]);
  
  // Calculate the SIQS score to display, with improved logic
  const siqsScore = useMemo(() => {
    // Use real-time SIQS if available
    if (realTimeSiqs !== null) return realTimeSiqs;
    
    // Otherwise use location's SIQS if available
    const locationSiqs = getSiqsScore(location);
    if (locationSiqs > 0) return locationSiqs;
    
    // For certified locations without SIQS, provide a default good score
    if (isCertified) {
      return location.isDarkSkyReserve ? 7.5 : 6.5;
    }
    
    return null;
  }, [location, realTimeSiqs, isCertified]);
  
  // Determine the CSS class for styling based on SIQS
  const siqsClass = getSiqsClass(siqsScore);
  
  // Get an appropriate marker icon
  const icon = useMemo(() => {
    return getLocationMarker(location, isCertified, isHovered, Boolean(isMobile));
  }, [location, isCertified, isHovered, isMobile]);
  
  // Real-time SIQS handling
  const handleSiqsCalculated = useCallback((siqs: number | null, loading: boolean, confidence?: number) => {
    setRealTimeSiqs(siqs);
    setSiqsLoading(loading);
    if (confidence) setSiqsConfidence(confidence);
  }, []);
  
  // Handle marker events
  const handleClick = useCallback(() => {
    onClick(location);
  }, [location, onClick]);
  
  const handleMouseOver = useCallback(() => {
    onHover(locationId);
  }, [locationId, onHover]);
  
  const handleMouseOut = useCallback(() => {
    onHover(null);
  }, [onHover]);
  
  // Handle touch events for mobile
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
  
  // Check if coordinates are valid
  if (!location.latitude || !location.longitude || 
      !isFinite(location.latitude) || !isFinite(location.longitude)) {
    console.error("Invalid location coordinates:", location);
    return null;
  }
  
  // Always fetch real-time SIQS for any displayed location
  const shouldShowRealTimeSiqs = true;
  
  return (
    <>
      <RealTimeSiqsProvider
        isVisible={isHovered}
        latitude={location.latitude}
        longitude={location.longitude}
        bortleScale={location.bortleScale}
        isCertified={isCertified}
        isDarkSkyReserve={location.isDarkSkyReserve}
        existingSiqs={location.siqs}
        onSiqsCalculated={handleSiqsCalculated}
      />
      
      <Marker
        position={[location.latitude, location.longitude]}
        icon={icon}
        onClick={handleClick}
      >
        <MarkerEventHandler 
          marker={null}
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
                <Star className="h-3 w-3 mr-1" />
                {location.certification}
              </div>
            )}
            
            <div className="mt-2 flex items-center justify-between">
              {/* Always show SIQS badge for all locations */}
              <div className="flex items-center gap-1.5">
                <SiqsScoreBadge 
                  score={siqsScore !== null ? siqsScore : (isCertified ? 6.5 : 0)} 
                  compact={true} 
                  loading={siqsLoading && isHovered}
                  forceCertified={isCertified && !siqsScore}
                />
              </div>
              
              {typeof location.distance === 'number' && isFinite(location.distance) && (
                <span className="text-xs text-gray-300 flex items-center justify-end">
                  {formatDistance(location.distance)}
                </span>
              )}
            </div>
            
            <div className="mt-2 text-center">
              <button 
                onClick={handleClick}
                className={`text-xs flex items-center justify-center w-full bg-primary/20 hover:bg-primary/30 text-primary-foreground ${isMobile ? 'py-3' : 'py-1.5'} px-2 rounded transition-colors`}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {t("View Details", "查看详情")}
              </button>
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export default React.memo(LocationMarker);

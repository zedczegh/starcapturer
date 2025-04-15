
import React, { useCallback } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from '@/hooks/use-mobile';
import { getSiqsClass, getCertificationColor } from '@/utils/markerUtils';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import MarkerPopupContent from './MarkerPopupContent';

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

const LocationMarker: React.FC<LocationMarkerProps> = ({
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
}) => {
  const { language } = useLanguage();
  const isMobile = useIsMobile();

  const handleClick = useCallback(() => {
    onClick(location);
  }, [location, onClick]);

  const handleMouseOver = useCallback(() => {
    onHover(locationId);
  }, [locationId, onHover]);

  const handleMouseOut = useCallback(() => {
    onHover(null);
  }, [onHover]);
  
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

  // Create marker icon based on location type
  const icon = React.useMemo(() => {
    const sizeMultiplier = isMobile ? 1.2 : 1.0;
    if (isCertified) {
      const certColor = getCertificationColor(location);
      return createCustomMarker(certColor, 'star', sizeMultiplier);
    } else {
      const defaultColor = '#4ADE80';
      const color = location.siqs ? (typeof location.siqs === 'number' ? String(location.siqs) : location.siqs) : defaultColor;
      return createCustomMarker(color, 'circle', sizeMultiplier);
    }
  }, [location, isCertified, isMobile]);

  if (activeView === 'certified' && !isCertified) {
    return null;
  }

  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
      eventHandlers={{
        click: handleClick,
        mouseover: handleMouseOver,
        mouseout: handleMouseOut
      }}
    >
      <Popup closeOnClick={false} autoClose={false}>
        <MarkerPopupContent
          location={location}
          isCertified={isCertified}
          isMobile={isMobile}
          language={language}
        />
      </Popup>
    </Marker>
  );
};

export default LocationMarker;

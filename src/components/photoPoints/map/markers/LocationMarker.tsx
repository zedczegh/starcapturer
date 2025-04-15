
import React, { useCallback } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Star, Award, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistance } from '@/utils/geoUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { getSiqsClass, getCertificationColor } from '@/utils/markerUtils';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import SiqsScoreBadge from '../../cards/SiqsScoreBadge';
import MarkerPopupContent from './MarkerPopupContent';

interface LocationMarkerProps {
  location: SharedAstroSpot;
  onClick: (location: SharedAstroSpot) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  locationId: string;
  isCertified: boolean;
  activeView: 'certified' | 'calculated';
}

const LocationMarker: React.FC<LocationMarkerProps> = ({
  location,
  onClick,
  isHovered,
  onHover,
  locationId,
  isCertified,
  activeView
}) => {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    onClick(location);
  }, [location, onClick]);

  const handleMouseOver = useCallback(() => {
    onHover(locationId);
  }, [locationId, onHover]);

  const handleMouseOut = useCallback(() => {
    onHover(null);
  }, [onHover]);

  // Create marker icon based on location type
  const icon = React.useMemo(() => {
    const sizeMultiplier = isMobile ? 1.2 : 1.0;
    if (isCertified) {
      const certColor = getCertificationColor(location);
      return createCustomMarker(certColor, 'star', sizeMultiplier);
    } else {
      const defaultColor = '#4ADE80';
      const color = location.siqs ? location.siqs : defaultColor;
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
        mouseover: handleMouseOver,
        mouseout: handleMouseOut,
        click: handleClick
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

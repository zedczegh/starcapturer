
import React, { memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useIsMobile } from '@/hooks/use-mobile';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import SiqsScoreBadge from '../../cards/SiqsScoreBadge';
import { getLocationMarker, getDisplayName, getMarkerSiqsClass } from './MarkerUtils';
import { useLanguage } from "@/contexts/LanguageContext";

interface LocationMarkerProps {
  location: SharedAstroSpot;
  onClick: (location: SharedAstroSpot) => void;
  locationId: string;
  isCertified: boolean;
  activeView: 'certified' | 'calculated';
}

const LocationMarker = memo(({ 
  location, 
  onClick, 
  locationId,
  isCertified, 
  activeView
}: LocationMarkerProps) => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  
  if (!location.latitude || !location.longitude) return null;
  
  const position: [number, number] = [location.latitude, location.longitude];
  const siqsClass = getMarkerSiqsClass(location.siqs);
  const displayName = getDisplayName(location, language);
  const icon = getLocationMarker(location, isCertified, isMobile);
  
  const handleMarkerClick = (e: L.LeafletMouseEvent) => {
    // Prevent default zoom behavior
    e.target._map.getZoom();
    onClick(location);
  };
  
  return (
    <Marker
      position={position}
      icon={icon}
      onClick={handleMarkerClick}
    >
      <Popup 
        closeOnClick={false}
        autoClose={true}
      >
        <div className={`p-2 leaflet-popup-custom marker-popup-gradient ${siqsClass}`}>
          <div className="font-medium">{displayName}</div>
          
          {location.distance !== undefined && (
            <div className="text-xs mt-1">
              {t("Distance", "距离")}: {Math.round(location.distance * 10) / 10} km
            </div>
          )}
          
          {location.siqs !== undefined && (
            <div className="text-xs mt-1 flex items-center">
              <span className="mr-1">SIQS:</span>
              <SiqsScoreBadge score={location.siqs} compact={true} />
            </div>
          )}
          
          {location.certification && (
            <div className="text-xs mt-1.5 pb-0.5">
              <span className="italic text-emerald-700 dark:text-emerald-400">
                {location.certification}
              </span>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
});

LocationMarker.displayName = 'LocationMarker';

export default LocationMarker;

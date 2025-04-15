
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from '@/hooks/use-mobile';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { createUserMarker } from './markerUtils/markerIconGenerator';

interface UserLocationMarkerProps {
  position: [number, number];
  currentSiqs: number | null;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ position, currentSiqs }) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  const userMarkerIcon = createUserMarker(isMobile);
  
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
};

export default UserLocationMarker;

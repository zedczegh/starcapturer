
import React, { memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import SiqsScoreBadge from '../../cards/SiqsScoreBadge';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import '../MapStyles.css';

interface UserLocationMarkerProps {
  position: [number, number];
  currentSiqs: number | null;
}

const UserLocationMarker = memo(({ position, currentSiqs }: UserLocationMarkerProps) => {
  const { t } = useLanguage();
  // Red color for user location
  const userMarkerIcon = createCustomMarker('#e11d48', 'user');
  
  return (
    <Marker position={position} icon={userMarkerIcon}>
      <Popup>
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

export default UserLocationMarker;

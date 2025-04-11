
import React, { memo } from 'react';
import { Marker } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import SiqsScoreBadge from '../../cards/SiqsScoreBadge';
import MapTooltip from '@/components/location/map/MapTooltip';

// User location marker component
const UserLocationMarker = memo(({ 
  position, 
  currentSiqs 
}: { 
  position: [number, number], 
  currentSiqs: number | null 
}) => {
  const { t } = useLanguage();
  // Using red color for user location
  const userMarkerIcon = createCustomMarker('#e11d48', 'user');
  
  return (
    <Marker position={position} icon={userMarkerIcon}>
      <MapTooltip
        name={t("Your Location", "您的位置")}
        className="user-location-popup"
      >
        <div className="text-xs mt-1">
          {position[0].toFixed(5)}, {position[1].toFixed(5)}
        </div>
        {currentSiqs !== null && (
          <div className="text-xs mt-1.5 flex items-center">
            <span className="mr-1">SIQS:</span>
            <SiqsScoreBadge score={currentSiqs} compact={true} />
          </div>
        )}
      </MapTooltip>
    </Marker>
  );
});

UserLocationMarker.displayName = 'UserLocationMarker';

export default UserLocationMarker;

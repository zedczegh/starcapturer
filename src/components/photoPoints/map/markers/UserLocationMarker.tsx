
import React, { memo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import SiqsScoreBadge from '../../cards/SiqsScoreBadge';
import { MapPin } from 'lucide-react';

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
  const userMarkerIcon = createCustomMarker('#e11d48', 'pulse');
  
  return (
    <Marker position={position} icon={userMarkerIcon}>
      <Popup
        closeOnClick={false}
        autoClose={false}
        className="user-location-popup"
      >
        <div className="p-3 w-[240px] leaflet-popup-custom user-location-gradient">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
            <strong className="text-white">{t("Your Location", "您的位置")}</strong>
          </div>
          
          <div className="mt-2 text-xs flex items-center text-gray-200">
            <MapPin className="h-3 w-3 mr-1.5 text-gray-300" />
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </div>
          
          {currentSiqs !== null && (
            <div className="mt-2 flex items-center">
              <span className="text-xs mr-1.5 text-gray-200">{t("SIQS Score:", "SIQS 评分:")}</span>
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

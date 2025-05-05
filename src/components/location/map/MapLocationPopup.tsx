
import React from 'react';
import { Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';

interface MapLocationPopupProps {
  name: string;
  position: [number, number];
  isDarkSkyReserve?: boolean;
  certification?: string;
}

const MapLocationPopup: React.FC<MapLocationPopupProps> = ({
  name,
  position,
  isDarkSkyReserve,
  certification
}) => {
  const { t } = useLanguage();
  
  // Always use the provided name for certified locations
  const displayName = name || t("Selected Location", "所选位置");
  
  return (
    <Popup>
      <div className="p-1">
        <strong>{displayName}</strong>
        <div className="text-xs mt-1">
          {position[0].toFixed(5)}, {position[1].toFixed(5)}
        </div>
        {isDarkSkyReserve && (
          <div className="mt-1 text-xs font-semibold text-blue-600">
            {t("Dark Sky Reserve", "暗夜保护区")}
          </div>
        )}
        {certification && (
          <div className="mt-1 text-xs font-semibold text-green-600">
            {certification}
          </div>
        )}
      </div>
    </Popup>
  );
};

export default MapLocationPopup;


import React from 'react';
import { Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';

interface MapLocationPopupProps {
  name: string;
  position: [number, number];
  isDarkSkyReserve?: boolean;
  certification?: string;
  chineseName?: string;
}

const MapLocationPopup: React.FC<MapLocationPopupProps> = ({
  name,
  position,
  isDarkSkyReserve,
  certification,
  chineseName
}) => {
  const { t, language } = useLanguage();
  
  // Use Chinese name if available and language is set to Chinese
  const displayName = language === 'zh' && chineseName 
    ? chineseName 
    : (name || t("Selected Location", "所选位置"));
  
  // Format certification text based on language
  const getCertificationText = () => {
    if (!certification && !isDarkSkyReserve) return null;
    
    if (isDarkSkyReserve) {
      return t("Dark Sky Reserve", "暗夜保护区");
    }
    
    if (!certification) return null;
    
    const cert = certification.toLowerCase();
    if (cert.includes('park')) {
      return t("Dark Sky Park", "暗夜公园");
    } else if (cert.includes('community')) {
      return t("Dark Sky Community", "暗夜社区");
    } else if (cert.includes('urban')) {
      return t("Urban Night Sky", "城市夜空");
    } else if (cert.includes('lodging')) {
      return t("Dark Sky Lodging", "暗夜住宿");
    } else {
      return t("Certified Location", "认证地点");
    }
  };
  
  const certificationText = getCertificationText();
  
  return (
    <Popup>
      <div className="p-1">
        <strong className="text-sm">{displayName}</strong>
        <div className="text-xs mt-1">
          {position[0].toFixed(5)}, {position[1].toFixed(5)}
        </div>
        {isDarkSkyReserve && !certificationText && (
          <div className="mt-1 text-xs font-semibold text-blue-600">
            {t("Dark Sky Reserve", "暗夜保护区")}
          </div>
        )}
        {certificationText && (
          <div className="mt-1 text-xs font-semibold text-green-600">
            {certificationText}
          </div>
        )}
      </div>
    </Popup>
  );
};

export default MapLocationPopup;

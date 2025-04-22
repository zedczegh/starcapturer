
import React, { useCallback, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { Telescope } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserAstroSpotMarkerProps {
  spot: SharedAstroSpot;
  onClick?: (spot: SharedAstroSpot) => void;
}

const UserAstroSpotMarker: React.FC<UserAstroSpotMarkerProps> = ({ spot, onClick }) => {
  const { t } = useLanguage();
  
  // Create a custom icon for the user astro spot
  const userAstroSpotIcon = useMemo(() => {
    // Create a custom divIcon with the Telescope icon
    return L.divIcon({
      html: `
        <div class="relative w-7 h-7 flex items-center justify-center">
          <span class="absolute w-7 h-7 rounded-full bg-sky-100 border-2 border-sky-400"></span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="relative z-10">
            <path d="M14.27 6.73 21 3l-3.73 6.73" />
            <path d="M6.5 9.5 14 2" />
            <path d="m7.68 7.35 15.23 13.04a2.13 2.13 0 0 1-2.56 3.32L6.31 11.36" />
            <path d="m10.13 10.56-3.94 3.94" />
            <path d="m6.19 14.5 3.94-3.94" />
            <line x1="3" x2="6.5" y1="6" y2="9.5" />
          </svg>
        </div>
      `,
      className: 'custom-telescope-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  }, []);

  const handleSpotClick = useCallback(() => {
    if (onClick) {
      onClick(spot);
    }
  }, [onClick, spot]);

  return (
    <Marker 
      position={[spot.latitude, spot.longitude]} 
      icon={userAstroSpotIcon} 
      // Fix: Use the proper event handling approach for react-leaflet v4
      eventHandlers={{
        click: handleSpotClick
      }}
    >
      <Popup>
        <div className="p-2">
          <h3 className="text-lg font-medium mb-1">{spot.name}</h3>
          {spot.description && (
            <p className="text-sm text-gray-600 mb-2">{spot.description}</p>
          )}
          <button 
            onClick={handleSpotClick}
            className="text-sm text-sky-600 font-medium hover:text-sky-800"
          >
            {t("View Location Profile", "查看位置资料")}
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

export default UserAstroSpotMarker;

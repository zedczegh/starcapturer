
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserLocationMarkerProps {
  position: [number, number];
  currentSiqs?: number | null;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ position, currentSiqs }) => {
  const { t } = useLanguage();
  
  const icon = new L.Icon({
    iconUrl: '/user-location.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
  
  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <div className="flex flex-col gap-1 min-w-[180px] p-1">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1.5 text-blue-500" />
            <span className="font-medium">
              {t("Your Location", "您的位置")}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </div>
          {currentSiqs !== null && (
            <div className="text-xs">
              SIQS: <span className="font-semibold">{currentSiqs.toFixed(1)}</span>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default UserLocationMarker;
export { UserLocationMarker };

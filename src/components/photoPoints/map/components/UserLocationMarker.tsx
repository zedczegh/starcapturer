
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserLocationMarkerProps {
  position: [number, number];
  currentSiqs?: number | null;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ 
  position, 
  currentSiqs,
  onLocationUpdate 
}) => {
  const { t } = useLanguage();
  
  // Create a custom red marker icon with pulse effect
  const icon = new L.Icon({
    iconUrl: '/user-location.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    className: 'red-pulse-marker'
  });
  
  return (
    <Marker position={position} icon={icon}>
      <Popup className="custom-popup user-location-popup">
        <div className="flex flex-col gap-1.5 min-w-[200px] p-2.5">
          <div className="flex items-center text-primary">
            <MapPin className="h-4 w-4 mr-1.5" />
            <span className="font-medium">
              {t("Your Location", "您的位置")}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 border-t border-gray-700/30 pt-1.5">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </div>
          {currentSiqs !== null && (
            <div className="text-xs mt-1">
              SIQS: <span className="font-semibold text-primary">{currentSiqs.toFixed(1)}</span>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default UserLocationMarker;
export { UserLocationMarker };

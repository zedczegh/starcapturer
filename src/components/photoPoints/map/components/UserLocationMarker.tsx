
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
  const icon = L.divIcon({
    className: "custom-user-location",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
    html: `
      <div class="relative w-full h-full">
        <div class="absolute inset-0 bg-red-500 rounded-full opacity-30 animate-ping"></div>
        <div class="absolute inset-0 bg-red-500 rounded-full opacity-50 scale-75 animate-ping animation-delay-300"></div>
        <div class="absolute inset-1 bg-red-500 rounded-full shadow-lg border border-white"></div>
      </div>
    `
  });
  
  return (
    <Marker position={position} icon={icon} onClick={() => onLocationUpdate && onLocationUpdate(position[0], position[1])}>
      <Popup>
        <div className="flex flex-col gap-1 min-w-[180px] p-1">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1.5 text-red-500" />
            <span className="font-medium">
              {t("Your Location", "您的位置")}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </div>
          {currentSiqs !== null && (
            <div className="text-xs">
              SIQS: <span className="font-semibold">{currentSiqs?.toFixed(1)}</span>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default UserLocationMarker;
export { UserLocationMarker };

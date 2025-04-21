
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useLanguage } from "@/contexts/LanguageContext";
import SiqsScoreBadge from '../../cards/SiqsScoreBadge';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';

interface UserLocationMarkerProps {
  position: [number, number];
  currentSiqs: number | null;
}

const UserLocationMarker = memo(({ 
  position, 
  currentSiqs 
}: UserLocationMarkerProps) => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const userMarkerIcon = createCustomMarker('#e11d48', 'circle', isMobile ? 1.2 : 1.0);

  // State for reverse geocoded name
  const [locationName, setLocationName] = useState<string>('');
  const [loadingName, setLoadingName] = useState<boolean>(true);

  useEffect(() => {
    let ignore = false;
    const fetchName = async () => {
      setLoadingName(true);
      try {
        const details = await getEnhancedLocationDetails(position[0], position[1], language === 'zh' ? 'zh' : 'en');
        if (!ignore) {
          setLocationName(details.formattedName || '');
        }
      } catch (e) {
        if (!ignore) setLocationName('');
      } finally {
        if (!ignore) setLoadingName(false);
      }
    };
    fetchName();
    return () => { ignore = true; };
  }, [position, language]);

  const handleViewDetails = useCallback(() => {
    navigate(`/location/${position[0].toFixed(6)},${position[1].toFixed(6)}`, {
      state: {
        latitude: position[0],
        longitude: position[1],
        isUserLocation: true,
        name: locationName || t("Your Location", "您的位置"),
      }
    });
  }, [navigate, position, locationName, t]);

  return (
    <Marker position={position} icon={userMarkerIcon}>
      <Popup
        offset={[0, 10]}
        direction="bottom"
      >
        <div className="p-2 leaflet-popup-custom marker-popup-gradient min-w-[180px]">
          <strong>
            {loadingName
              ? <span className="animate-pulse text-xs text-muted-foreground">{t("Loading location...", "正在加载位置...")}</span>
              : (locationName || t("Your Location", "您的位置"))}
          </strong>
          <div className="text-xs mt-1">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </div>
          {currentSiqs !== null && (
            <div className="text-xs mt-1.5 flex items-center">
              <span className="mr-1">SIQS:</span>
              <SiqsScoreBadge score={currentSiqs} compact={true} />
            </div>
          )}
          <div className="mt-2 text-center">
            <button 
              onClick={handleViewDetails}
              className={`text-xs flex items-center justify-center w-full bg-primary/20 hover:bg-primary/30 text-primary-foreground ${isMobile ? 'py-3' : 'py-1.5'} px-2 rounded transition-colors`}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {t("View Details", "查看详情")}
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
});

UserLocationMarker.displayName = 'UserLocationMarker';

export { UserLocationMarker };

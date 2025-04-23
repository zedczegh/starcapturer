
import React, { memo, useCallback, useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useLanguage } from "@/contexts/LanguageContext";
import SiqsScoreBadge from '../../cards/SiqsScoreBadge';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';
import { supabase } from '@/integrations/supabase/client';
import CreateAstroSpotDialog from '@/components/astro-spots/CreateAstroSpotDialog';

interface UserLocationMarkerProps {
  position: [number, number];
  currentSiqs: number | null;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

const UserLocationMarker = memo(({ 
  position, 
  currentSiqs,
  onLocationUpdate 
}: UserLocationMarkerProps) => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const userMarkerIcon = createCustomMarker('#e11d48', 'circle', isMobile ? 1.2 : 1.0);

  const [locationName, setLocationName] = useState<string>('');
  const [loadingName, setLoadingName] = useState<boolean>(true);
  const [isWaterLocation, setIsWaterLocation] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
  }, []);

  useEffect(() => {
    let ignore = false;
    const fetchName = async () => {
      setLoadingName(true);
      try {
        const details = await getEnhancedLocationDetails(
          position[0], 
          position[1], 
          language === 'zh' ? 'zh' : 'en'
        );
        
        if (!ignore) {
          setLocationName(details.formattedName || '');
          setIsWaterLocation(details.isWater || false);
          
          if (details.isWater) {
            console.log("Location was detected as water but overriding for user marker");
            if (details.townName || details.cityName) {
              const nearestPlace = details.townName || details.cityName;
              setLocationName(language === 'en' 
                ? `Near ${nearestPlace}`
                : `靠近 ${nearestPlace}`);
            } else {
              setLocationName(t("Your Location", "您的位置"));
            }
          }
        }
      } catch (e) {
        if (!ignore) {
          setLocationName(t("Your Location", "您的位置"));
          setIsWaterLocation(false);
        }
      } finally {
        if (!ignore) setLoadingName(false);
      }
    };
    fetchName();
    return () => { ignore = true; };
  }, [position, language, t]);

  const handleViewDetails = useCallback(() => {
    navigate(`/location/${position[0].toFixed(6)},${position[1].toFixed(6)}`, {
      state: {
        latitude: position[0],
        longitude: position[1],
        isUserLocation: true,
        name: locationName || t("Your Location", "您的位置"),
        isWater: false
      }
    });
  }, [navigate, position, locationName, t]);

  const handleOpenDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const handleMarkerClick = useCallback(() => {
    setIsPopupOpen(true);
  }, []);
  
  const handlePopupClose = useCallback(() => {
    setIsPopupOpen(false);
  }, []);

  return (
    <>
      <Marker 
        position={position} 
        icon={userMarkerIcon}
        onClick={handleMarkerClick}
      >
        <Popup
          offset={[0, 10]}
          closeOnClick={false}
          onOpen={() => setIsPopupOpen(true)}
          onClose={() => setIsPopupOpen(false)}
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
            <div className="mt-2 flex flex-col gap-2">
              <button 
                onClick={handleViewDetails}
                className={`text-xs flex items-center justify-center w-full bg-primary/20 hover:bg-primary/30 text-primary-foreground ${isMobile ? 'py-3' : 'py-1.5'} px-2 rounded transition-colors`}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {t("View Details", "查看详情")}
              </button>
              
              {isAuthenticated && (
                <button 
                  onClick={handleOpenDialog}
                  className={`
                    text-xs flex items-center justify-center w-full 
                    bg-gradient-to-br from-purple-500/80 to-indigo-600/80 
                    text-white 
                    ${isMobile ? 'py-3' : 'py-1.5'} 
                    px-2 rounded-lg 
                    transition-all duration-300 
                    hover:scale-[1.02] hover:shadow-lg 
                    active:scale-[0.98]
                    shadow-md shadow-purple-500/30
                    border border-purple-500/20
                  `}
                >
                  {t("Create My Astro Spot", "创建我的观星点")}
                </button>
              )}
            </div>
          </div>
        </Popup>
      </Marker>

      {isDialogOpen && (
        <CreateAstroSpotDialog
          latitude={position[0]}
          longitude={position[1]}
          defaultName={locationName || t("My Astro Spot", "我的观星点")}
          onClose={handleCloseDialog}
        />
      )}
    </>
  );
});

UserLocationMarker.displayName = 'UserLocationMarker';

export { UserLocationMarker };

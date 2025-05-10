
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import SiqsScoreBadge from '@/components/photoPoints/cards/SiqsScoreBadge';
import { MapPin, ExternalLink } from 'lucide-react';
import RealTimeSiqsProvider from '@/components/photoPoints/cards/RealTimeSiqsProvider';
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';
import { useNavigate } from 'react-router-dom';
import CreateAstroSpotDialog from '@/components/astro-spots/CreateAstroSpotDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(currentSiqs || null);
  const [siqsLoading, setSiqsLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [locationName, setLocationName] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isMarkerReady, setIsMarkerReady] = useState(false);
  
  // Create a memoized marker icon to prevent unnecessary re-renders
  const userMarkerIcon = useMemo(() => 
    createCustomMarker('#e11d48', 'circle', isMobile ? 1.2 : 1.0), 
    [isMobile]
  );

  // Handle SIQS calculation completion
  const handleSiqsCalculated = useCallback((siqs: number | null, loading: boolean) => {
    if (siqs !== null && siqs > 0) {
      console.log("User location SIQS calculated:", siqs);
      setRealTimeSiqs(siqs);
    }
    setSiqsLoading(loading);
  }, []);

  // Refresh SIQS data
  const handleRefreshSiqs = useCallback(() => {
    setForceUpdate(true);
    setSiqsLoading(true);
    // Reset forceUpdate flag after a short delay
    setTimeout(() => setForceUpdate(false), 100);
  }, []);

  // Initialize marker
  useEffect(() => {
    setIsMarkerReady(true);
    handleRefreshSiqs();
  }, []);

  // Fetch location name when position changes
  useEffect(() => {
    if (!position || !isFinite(position[0]) || !isFinite(position[1])) return;
    
    const fetchLocationName = async () => {
      setIsLoadingLocation(true);
      try {
        const details = await getEnhancedLocationDetails(position[0], position[1], language === 'zh' ? 'zh' : 'en');
        setLocationName(details.formattedName || '');
        
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
      } catch (error) {
        console.error('Error fetching location name:', error);
        setLocationName(t("Your Location", "您的位置"));
      } finally {
        setIsLoadingLocation(false);
      }
    };

    fetchLocationName();
  }, [position, language, t]);

  // Force refresh SIQS data when position changes
  useEffect(() => {
    if (position && isFinite(position[0]) && isFinite(position[1])) {
      handleRefreshSiqs();
      setSiqsLoading(true);
    }
  }, [position, handleRefreshSiqs]);

  // Navigate to location details page
  const handleViewDetails = useCallback(() => {
    navigate(`/location/${position[0].toFixed(6)},${position[1].toFixed(6)}`, {
      state: {
        latitude: position[0],
        longitude: position[1],
        name: locationName || t("Your Location", "您的位置"),
        isUserLocation: true
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
    // Refresh SIQS when opening popup
    handleRefreshSiqs();
  }, [handleRefreshSiqs]);
  
  const handlePopupClose = useCallback(() => {
    setIsPopupOpen(false);
  }, []);

  // Only render when position is valid
  if (!position || !isFinite(position[0]) || !isFinite(position[1]) || !isMarkerReady) {
    return null;
  }

  return (
    <>
      <RealTimeSiqsProvider
        isVisible={true}
        latitude={position[0]}
        longitude={position[1]}
        onSiqsCalculated={handleSiqsCalculated}
        forceUpdate={forceUpdate}
        existingSiqs={currentSiqs}
      />
      
      <Marker 
        position={position} 
        icon={userMarkerIcon}
        eventHandlers={{
          click: handleMarkerClick
        }}
      >
        <Popup
          offset={[0, 10]}
          onClose={handlePopupClose}
          onOpen={() => {
            setIsPopupOpen(true);
            handleRefreshSiqs();
          }}
        >
          <div className="p-2 leaflet-popup-custom marker-popup-gradient min-w-[180px]">
            <strong>
              {isLoadingLocation
                ? <span className="animate-pulse text-xs text-muted-foreground">{t("Loading location...", "正在加载位置...")}</span>
                : (locationName || t("Your Location", "您的位置"))}
            </strong>
            <div className="text-xs mt-1">
              {position[0].toFixed(5)}, {position[1].toFixed(5)}
            </div>
            <div className="text-xs mt-1.5 flex items-center">
              <span className="mr-1">SIQS:</span>
              <SiqsScoreBadge 
                score={realTimeSiqs} 
                compact={true} 
                loading={siqsLoading} 
              />
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <button 
                onClick={handleViewDetails}
                className={`text-xs flex items-center justify-center w-full bg-primary/20 hover:bg-primary/30 text-primary-foreground ${isMobile ? 'py-3' : 'py-1.5'} px-2 rounded transition-colors`}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {t("View Details", "查看详情")}
              </button>
              
              {user && (
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
      
      {user && isDialogOpen && (
        <CreateAstroSpotDialog
          latitude={position[0]}
          longitude={position[1]}
          defaultName={locationName || t("My Astro Spot", "我的观星点")}
          onClose={handleCloseDialog}
        />
      )}
    </>
  );
};

export default React.memo(UserLocationMarker);

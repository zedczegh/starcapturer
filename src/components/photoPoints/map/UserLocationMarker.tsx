
import React, { useState, useCallback, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { MapPin, ExternalLink } from 'lucide-react';
import RealTimeSiqsProvider from '../cards/RealTimeSiqsProvider';
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';
import { useNavigate } from 'react-router-dom';
import CreateAstroSpotDialog from '@/components/astro-spots/CreateAstroSpotDialog';
import { useAuth } from '@/contexts/AuthContext';

interface UserLocationMarkerProps {
  position: [number, number];
  currentSiqs?: number | null;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ position }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [siqsLoading, setSiqsLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [locationName, setLocationName] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleSiqsCalculated = useCallback((siqs: number | null, loading: boolean) => {
    setRealTimeSiqs(siqs);
    setSiqsLoading(loading);
  }, []);

  const handleRefreshSiqs = () => {
    setForceUpdate(true);
    setTimeout(() => setForceUpdate(false), 100);
  };

  // Fetch location name when position changes
  useEffect(() => {
    const fetchLocationName = async () => {
      setIsLoadingLocation(true);
      try {
        const details = await getEnhancedLocationDetails(position[0], position[1], language === 'zh' ? 'zh' : 'en');
        setLocationName(details.formattedName || details.displayName || details.formattedAddress || '');
      } catch (error) {
        console.error('Error fetching location name:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    fetchLocationName();
  }, [position, language]);

  // Force refresh SIQS data when position changes
  useEffect(() => {
    handleRefreshSiqs();
    setSiqsLoading(true);
    setRealTimeSiqs(null);
  }, [position]);

  const handleViewDetails = () => {
    navigate(`/location/${position[0].toFixed(6)},${position[1].toFixed(6)}`, {
      state: {
        latitude: position[0],
        longitude: position[1],
        name: locationName || t("Your Location", "您的位置"),
        isUserLocation: true
      }
    });
  };

  const handleOpenDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const togglePopup = useCallback(() => {
    setIsPopupOpen(!isPopupOpen);
    if (!isPopupOpen) {
      handleRefreshSiqs();
    }
  }, [isPopupOpen]);

  return (
    <>
      <RealTimeSiqsProvider
        isVisible={true}
        latitude={position[0]}
        longitude={position[1]}
        onSiqsCalculated={handleSiqsCalculated}
        forceUpdate={forceUpdate}
      />
      
      <Marker 
        position={position} 
        icon={createCustomMarker('#e11d48')}
        onClick={togglePopup}
      >
        {isPopupOpen && (
          <Popup 
            closeOnClick={false} 
            autoClose={false}
          >
            <div className="p-2 min-w-[200px]">
              <div className="font-medium text-sm mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-primary" />
                {t("Your Location", "您的位置")}
              </div>
              
              <div className="mb-2">
                {isLoadingLocation ? (
                  <div className="text-sm text-muted-foreground animate-pulse">
                    {t("Loading location...", "正在加载位置...")}
                  </div>
                ) : locationName ? (
                  <div className="text-sm text-muted-foreground">
                    {locationName}
                  </div>
                ) : null}
                <div className="text-xs text-muted-foreground mt-1">
                  {position[0].toFixed(4)}, {position[1].toFixed(4)}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <SiqsScoreBadge 
                  score={realTimeSiqs} 
                  compact={true}
                  loading={siqsLoading}
                />
                <button
                  onClick={handleViewDetails}
                  className="text-xs text-primary hover:text-primary/80 px-2 py-1 flex items-center"
                  disabled={siqsLoading}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {t("View Details", "查看详情")}
                </button>
              </div>

              {user && (
                <button
                  onClick={handleOpenDialog}
                  className="mt-3 text-xs flex items-center justify-center w-full bg-gradient-to-br from-purple-500/80 to-indigo-600/80 text-white py-2 px-2 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] shadow-md shadow-purple-500/30 border border-purple-500/20"
                >
                  {t("Create My Astro Spot", "创建我的观星点")}
                </button>
              )}
            </div>
          </Popup>
        )}
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

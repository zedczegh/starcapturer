
import React, { useState, useCallback, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { MapPin, ExternalLink, Plus } from 'lucide-react';
import RealTimeSiqsProvider from '../cards/RealTimeSiqsProvider';
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface UserLocationMarkerProps {
  position: [number, number];
  currentSiqs?: number | null;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ position }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [siqsLoading, setSiqsLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [locationName, setLocationName] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  
  const handleSiqsCalculated = useCallback((siqs: number | null, loading: boolean) => {
    setRealTimeSiqs(siqs);
    setSiqsLoading(loading);
  }, []);

  const handleRefreshSiqs = () => {
    setForceUpdate(true);
    setTimeout(() => setForceUpdate(false), 100);
  };

  useEffect(() => {
    const fetchLocationName = async () => {
      setIsLoadingLocation(true);
      try {
        const details = await getEnhancedLocationDetails(position[0], position[1], language === 'zh' ? 'zh' : 'en');
        setLocationName(details.formattedName || '');
      } catch (error) {
        console.error('Error fetching location name:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    fetchLocationName();
  }, [position, language]);

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

  const handleCreateAstroSpot = useCallback(() => {
    navigate(`/astro-spot/create`, {
      state: {
        latitude: position[0],
        longitude: position[1],
        name: locationName || t("Your Location", "您的位置"),
      }
    });
  }, [navigate, position, locationName, t]);

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
        onClick={handleRefreshSiqs}
      >
        <Popup closeOnClick={false} autoClose={false}>
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
            
            <div className="flex items-center justify-between mb-2">
              <SiqsScoreBadge 
                score={realTimeSiqs} 
                compact={true}
                loading={siqsLoading}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={handleViewDetails}
                className="text-xs text-primary hover:text-primary/80 px-2 py-1 flex items-center justify-center bg-primary/10 rounded-md"
                disabled={siqsLoading}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {t("View Details", "查看详情")}
              </button>
              
              {user && (
                <button
                  onClick={handleCreateAstroSpot}
                  className="text-xs text-primary hover:text-primary/80 px-2 py-1 flex items-center justify-center bg-primary/10 rounded-md"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {t("Create my Astro Spot", "创建我的天文观测点")}
                </button>
              )}
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export default React.memo(UserLocationMarker);

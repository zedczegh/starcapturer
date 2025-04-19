
import React, { useState, useCallback, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import { createCustomMarker } from '@/components/location/map/MapMarkerUtils';
import SiqsScoreBadge from '../cards/SiqsScoreBadge';
import { MapPin, ExternalLink } from 'lucide-react';
import RealTimeSiqsProvider from '../cards/RealTimeSiqsProvider';
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';
import { useNavigate } from 'react-router-dom';

interface UserLocationMarkerProps {
  position: [number, number];
  currentSiqs?: number | null;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ position }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [siqsLoading, setSiqsLoading] = useState(true); // Start with loading state
  const [forceUpdate, setForceUpdate] = useState(false);
  const [locationName, setLocationName] = useState<string>('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  
  const handleSiqsCalculated = useCallback((siqs: number | null, loading: boolean) => {
    console.log(`User location SIQS updated: ${siqs}, loading: ${loading}`);
    setRealTimeSiqs(siqs);
    setSiqsLoading(loading);
  }, []);

  const handleRefreshSiqs = () => {
    console.log("Forcing SIQS refresh for user location");
    setSiqsLoading(true);
    setForceUpdate(true);
    setTimeout(() => setForceUpdate(false), 100);
  };

  // Fetch location name when position changes
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

  // Force refresh SIQS data when position changes
  useEffect(() => {
    // Trigger refresh when position changes
    handleRefreshSiqs();
    
    // Also reset the state to ensure we get fresh data
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

  return (
    <>
      <RealTimeSiqsProvider
        isVisible={true}
        latitude={position[0]}
        longitude={position[1]}
        onSiqsCalculated={handleSiqsCalculated}
        forceUpdate={forceUpdate} // Use the state-controlled forceUpdate flag
      />
      
      <Marker 
        position={position} 
        icon={createCustomMarker('#e11d48')}
        onClick={handleRefreshSiqs}
      >
        <Popup 
          closeOnClick={false} 
          autoClose={false}
          offset={[0, 10]}
          direction="bottom"
        >
          <div className="py-2 px-0.5 max-w-[220px] leaflet-popup-custom-compact marker-popup-gradient">
            <div className="font-medium text-sm mb-1.5 flex items-center">
              <MapPin className="h-3.5 w-3.5 mr-1 text-primary" />
              <span className="text-gray-100">{t("Your Location", "您的位置")}</span>
            </div>
            
            <div className="mt-1 mb-2">
              {isLoadingLocation ? (
                <div className="text-xs text-muted-foreground animate-pulse">
                  {t("Loading location...", "正在加载位置...")}
                </div>
              ) : locationName ? (
                <div className="text-xs text-muted-foreground">
                  {locationName}
                </div>
              ) : null}
              <div className="text-xs text-muted-foreground mt-0.5">
                {position[0].toFixed(4)}, {position[1].toFixed(4)}
              </div>
            </div>
            
            <div className="mt-2 flex items-center justify-between">
              <SiqsScoreBadge 
                score={realTimeSiqs} 
                compact={true}
                loading={siqsLoading}
              />
            </div>
            
            <div className="mt-2 text-center">
              <button 
                onClick={handleViewDetails}
                className="text-xs flex items-center justify-center w-full bg-primary/20 hover:bg-primary/30 text-primary-foreground py-1.5 px-2 rounded transition-colors"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {t("View Details", "查看详情")}
              </button>
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export default React.memo(UserLocationMarker);

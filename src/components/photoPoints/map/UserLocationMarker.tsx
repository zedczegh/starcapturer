
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
import { getSiqsScore } from '@/utils/siqsHelpers';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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
  
  // Track previous position to avoid unnecessary recalculations
  const prevPositionRef = useRef<string>('');
  
  // Debounce timer for SIQS calculations
  const debounceTimerRef = useRef<number | null>(null);

  const handleSiqsCalculated = useCallback((siqs: number | null, loading: boolean) => {
    if (loading) {
      setSiqsLoading(true);
      return;
    }
    
    setSiqsLoading(false);
    setRealTimeSiqs(siqs);
  }, []);

  const handleRefreshSiqs = useCallback(() => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    
    // Debounce the SIQS update to prevent multiple rapid calculations
    debounceTimerRef.current = window.setTimeout(() => {
      setForceUpdate(true);
      setTimeout(() => setForceUpdate(false), 100);
      debounceTimerRef.current = null;
    }, 300);
  }, []);

  // Fetch location name when position changes - with cache
  const locationCache = useMemo(() => new Map<string, string>(), []);
  
  useEffect(() => {
    const currentPositionKey = `${position[0].toFixed(5)},${position[1].toFixed(5)}`;
    
    // Skip if position hasn't changed
    if (prevPositionRef.current === currentPositionKey) {
      return;
    }
    
    prevPositionRef.current = currentPositionKey;
    setIsLoadingLocation(true);
    
    // Check cache first
    if (locationCache.has(currentPositionKey)) {
      setLocationName(locationCache.get(currentPositionKey) || '');
      setIsLoadingLocation(false);
      return;
    }
    
    const fetchLocationName = async () => {
      try {
        const details = await getEnhancedLocationDetails(position[0], position[1], language === 'zh' ? 'zh' : 'en');
        const name = details.formattedName || details.displayName || details.formattedAddress || '';
        
        setLocationName(name);
        locationCache.set(currentPositionKey, name);
      } catch (error) {
        console.error('Error fetching location name:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    fetchLocationName();
  }, [position, language, locationCache]);

  // Force refresh SIQS data when position changes
  useEffect(() => {
    const currentPositionKey = `${position[0].toFixed(5)},${position[1].toFixed(5)}`;
    
    // Skip if this is not a real position change
    if (prevPositionRef.current !== currentPositionKey) {
      handleRefreshSiqs();
      setSiqsLoading(true);
      setRealTimeSiqs(null);
    }
  }, [position, handleRefreshSiqs]);

  // Memoize the navigate handler to avoid recreating on every render
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

  const togglePopup = useCallback(() => {
    setIsPopupOpen(!isPopupOpen);
    if (!isPopupOpen) {
      handleRefreshSiqs();
    }
  }, [isPopupOpen, handleRefreshSiqs]);

  // Memoize marker to prevent unnecessary re-renders
  const markerIcon = useMemo(() => createCustomMarker('#e11d48'), []);

  return (
    <>
      <RealTimeSiqsProvider
        isVisible={isPopupOpen || forceUpdate}
        latitude={position[0]}
        longitude={position[1]}
        onSiqsCalculated={handleSiqsCalculated}
        forceUpdate={forceUpdate}
        skipCache={forceUpdate}
        priority={5} // Higher priority for user location
      />
      
      <Marker 
        position={position} 
        icon={markerIcon}
        eventHandlers={{ 
          click: togglePopup 
        }}
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

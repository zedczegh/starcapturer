
import React, { useState, useEffect } from 'react';
import PhotoPointsLayout from '../components/photoPoints/PhotoPointsLayout';
import ViewToggle from '../components/photoPoints/ViewToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import usePhotoPointsMap from '@/hooks/photoPoints/usePhotoPointsMap';
import { usePhotoPointsSearch } from '@/hooks/usePhotoPointsSearch';
import DistanceRangeSlider from '@/components/photoPoints/DistanceRangeSlider';
import LocationQuality from '@/components/photoPoints/LocationQuality';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { PhotoPointsMap } from '@/components/photoPoints/map';
import LocationsList from '@/components/photoPoints/LocationsList';
import EmptyLocationDisplay from '@/components/photoPoints/EmptyLocationDisplay';

const PhotoPointsNearby = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // State for view toggle and search distance
  const [activeView, setActiveView] = useState<'certified' | 'calculated'>('calculated');
  const [searchDistance, setSearchDistance] = useState(100);
  
  // Use the photo points search hook with the search distance
  const {
    displayedLocations,
    loading,
    searching,
    refresh,
    switchView,
    activeView: hookActiveView
  } = usePhotoPointsSearch({
    userLocation: null,
    currentSiqs: null,
    searchRadius: searchDistance
  });
  
  // Update activeView in hook when local state changes
  useEffect(() => {
    switchView(activeView);
  }, [activeView, switchView]);
  
  // Get user location from somewhere (this would need to be implemented)
  const userLocation = null; // This would typically come from a hook or context
  
  // Use the map hook
  const {
    mapReady,
    handleMapReady,
    handleLocationClick,
    validLocations,
    mapCenter,
    initialZoom,
    certifiedLocationsLoading,
    loadingProgress,
    isSearching
  } = usePhotoPointsMap({
    userLocation,
    locations: displayedLocations,
    searchRadius: searchDistance,
    activeView
  });

  // Handle view toggle change
  const handleViewChange = (view: 'certified' | 'calculated') => {
    setActiveView(view);
  };

  // Handle location click for exploration
  const handleLocationExplore = (location: any) => {
    navigate(`/location/${location.id || 'new'}`, { state: location });
  };

  return (
    <PhotoPointsLayout>
      <div className="h-full flex flex-col">
        {/* Controls section */}
        <div className="flex flex-col p-4 pb-2 gap-4">
          <ViewToggle activeView={activeView} onViewChange={handleViewChange} />
          
          <div className="flex gap-4 flex-col sm:flex-row items-stretch">
            <div className="w-full sm:w-1/2">
              <DistanceRangeSlider 
                currentValue={searchDistance}
                onValueChange={setSearchDistance}
              />
            </div>
            
            <div className="w-full sm:w-1/2">
              <LocationQuality
                bortleScale={null}
                siqs={null}
                weather={null}
                isChecking={certifiedLocationsLoading}
              />
            </div>
          </div>
        </div>
        
        {/* Map and list view */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-0 h-full">
          {/* Map */}
          <div className="relative lg:col-span-2 h-[350px] sm:h-[450px] lg:h-full w-full">
            {mapReady ? (
              <PhotoPointsMap
                userLocation={userLocation}
                locations={validLocations}
                searchRadius={searchDistance}
                activeView={activeView}
                onMapReady={handleMapReady}
                onLocationClick={handleLocationClick}
                mapCenter={mapCenter}
                initialZoom={initialZoom}
                isSearching={isSearching}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-cosmic-900 bg-opacity-30">
                <div className="animate-pulse text-primary-foreground/70">
                  {t("Loading map...", "正在加载地图...")}
                </div>
              </div>
            )}
          </div>
          
          {/* Location list */}
          <div className="bg-cosmic-950/30 backdrop-blur-sm overflow-y-auto h-[500px] lg:h-full">
            {validLocations.length > 0 ? (
              <LocationsList 
                locations={validLocations}
                loading={loading}
                initialLoad={!mapReady}
                onViewDetails={handleLocationExplore}
              />
            ) : (
              <EmptyLocationDisplay 
                title={t("No locations found", "未找到位置")}
                description={t("Try adjusting your search criteria or viewing a different area.", "尝试调整搜索条件或查看不同区域。")}
              />
            )}
          </div>
        </div>
      </div>
    </PhotoPointsLayout>
  );
};

export default PhotoPointsNearby;

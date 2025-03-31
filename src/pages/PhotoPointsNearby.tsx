
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async'; // Fix the import to use react-helmet-async
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { useCertifiedLocations } from '@/hooks/location/useCertifiedLocations';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import ViewToggle, { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';
import DarkSkyLocations from '@/components/photoPoints/DarkSkyLocations';
import CalculatedLocations from '@/components/photoPoints/CalculatedLocations';
import DistanceRangeSlider from '@/components/photoPoints/DistanceRangeSlider';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/navigation/BackButton';

// Import react-helmet-async if not already installed
const PhotoPointsNearby: React.FC = () => {
  const { t } = useLanguage();
  const { loading: locationLoading, coords, getPosition } = useGeolocation({ language: 'en' });
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('certified');

  // Get user location from coordinates
  const userLocation = coords ? { latitude: coords.latitude, longitude: coords.longitude } : null;

  // Set up recommended locations with userLocation
  const {
    searchRadius,
    setSearchRadius,
    locations,
    loading,
    hasMore,
    loadMore,
    refreshSiqsData
  } = useRecommendedLocations(userLocation);

  // Process locations to separate certified and calculated
  const {
    certifiedLocations,
    calculatedLocations,
    certifiedCount,
    calculatedCount
  } = useCertifiedLocations(locations, searchRadius);

  // Handle radius change
  const handleRadiusChange = useCallback((value: number) => {
    setSearchRadius(value);
  }, [setSearchRadius]);

  // Listen for custom radius change events
  useEffect(() => {
    const handleSetRadius = (e: CustomEvent<{ radius: number }>) => {
      if (e.detail.radius) {
        setSearchRadius(e.detail.radius);
      }
    };
    
    document.addEventListener('set-search-radius', handleSetRadius as EventListener);
    
    return () => {
      document.removeEventListener('set-search-radius', handleSetRadius as EventListener);
    };
  }, [setSearchRadius]);

  // Call getUserLocation when the component mounts
  useEffect(() => {
    if (!userLocation) {
      getPosition();
    }
  }, [getPosition, userLocation]);

  return (
    <div className="min-h-screen bg-cosmic-950 bg-[url('/src/assets/star-field-bg.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      <Helmet>
        <title>{t("Photo Points Nearby | Sky Viewer", "附近拍摄点 | 天空观测")}</title>
      </Helmet>
      
      <div className="pt-20 md:pt-28 pb-20">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <div className="mb-6">
            <BackButton destination="/" />
          </div>
          
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-3xl font-bold mb-3">
              {t("Astronomy Photo Points", "天文摄影点")}
            </h1>
            <p className="text-muted-foreground max-w-xl">
              {t(
                "Discover the best locations for astrophotography near you. Filter by certified dark sky areas or algorithmically calculated spots.",
                "发现您附近最佳的天文摄影地点。按认证暗夜区域或算法计算的位置进行筛选。"
              )}
            </p>
          </div>
          
          {/* User location section */}
          {!userLocation && (
            <div className="flex justify-center mb-8">
              <Button
                onClick={getPosition}
                className="flex items-center gap-2"
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                {t("Use My Location", "使用我的位置")}
              </Button>
            </div>
          )}
          
          {/* Distance filter */}
          {userLocation && (
            <div className="max-w-xl mx-auto mb-8">
              <DistanceRangeSlider
                currentValue={searchRadius}
                onValueChange={handleRadiusChange}
                minValue={100}
                maxValue={10000}
                stepValue={100}
              />
            </div>
          )}
          
          {/* Tab toggle */}
          <div className="mb-6">
            <ViewToggle
              activeView={activeView}
              onViewChange={setActiveView}
              certifiedCount={certifiedCount}
              calculatedCount={calculatedCount}
              loading={loading}
            />
          </div>
          
          {/* Content based on active view */}
          {activeView === 'certified' ? (
            <DarkSkyLocations
              locations={certifiedLocations}
              loading={loading && !locationLoading}
            />
          ) : (
            <CalculatedLocations
              locations={calculatedLocations}
              loading={loading && !locationLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onRefresh={refreshSiqsData}
              searchRadius={searchRadius}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoPointsNearby;

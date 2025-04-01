
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { useCertifiedLocations } from '@/hooks/location/useCertifiedLocations';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import ViewToggle, { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';
import DarkSkyLocations from '@/components/photoPoints/DarkSkyLocations';
import CalculatedLocations from '@/components/photoPoints/CalculatedLocations';
import DistanceRangeSlider from '@/components/photoPoints/DistanceRangeSlider';
import { MapPin, Loader2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearDarkSkyLocationCache } from '@/services/darkSkyLocationService';
import { clearSiqsCache } from '@/services/realTimeSiqsService';
import { clearLocationSearchCache } from '@/services/locationCacheService';
import { motion } from 'framer-motion';

const PhotoPointsNearby: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { loading: locationLoading, coords, getPosition } = useGeolocation({
    enableHighAccuracy: true
  });
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('certified');
  const [isChangingRadius, setIsChangingRadius] = useState(false);
  const pageLoaded = useRef(false);

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

  // Handle radius change with debounce
  const handleRadiusChange = useCallback((value: number) => {
    setIsChangingRadius(true);
    // Clear previous timer if it exists
    const timerId = (window as any).__radiusDebounce;
    if (timerId) {
      clearTimeout(timerId);
    }
    
    // Set a new timer
    (window as any).__radiusDebounce = setTimeout(() => {
      // Clear caches when radius changes significantly
      if (Math.abs(value - searchRadius) > 500) {
        clearDarkSkyLocationCache();
        clearSiqsCache();
        clearLocationSearchCache();
      }
      
      setSearchRadius(value);
      setIsChangingRadius(false);
    }, 300);
  }, [setSearchRadius, searchRadius]);

  // Listen for custom radius change events
  useEffect(() => {
    const handleSetRadius = (e: CustomEvent<{ radius: number }>) => {
      if (e.detail.radius) {
        handleRadiusChange(e.detail.radius);
      }
    };
    
    document.addEventListener('set-search-radius', handleSetRadius as EventListener);
    
    return () => {
      document.removeEventListener('set-search-radius', handleSetRadius as EventListener);
    };
  }, [handleRadiusChange]);

  // Call getUserLocation when the component mounts
  useEffect(() => {
    if (!userLocation && !pageLoaded.current) {
      pageLoaded.current = true;
      getPosition();
    }
  }, [getPosition, userLocation]);

  // Cleanup caches when component unmounts
  useEffect(() => {
    return () => {
      // Clear any active debounce timer
      const timerId = (window as any).__radiusDebounce;
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, []);

  // Page animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Page title - using Helmet for proper title handling
  const pageTitle = t("Photo Points Nearby | Sky Viewer", "附近拍摄点 | 天空观测");
  
  return (
    <motion.div 
      className="min-h-screen bg-cosmic-950 bg-[url('/src/assets/star-field-bg.jpg')] bg-cover bg-fixed bg-center bg-no-repeat"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Use Helmet component for setting page title */}
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      
      <div className="pt-20 md:pt-28 pb-20">
        <motion.div 
          className="container mx-auto px-4"
          variants={containerVariants}
        >
          {/* Back Button */}
          <motion.div 
            className="mb-6"
            variants={itemVariants}
          >
            <Button 
              onClick={() => navigate('/')}
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-cosmic-800/50 hover:text-white flex items-center"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("Back to Home", "返回首页")}
            </Button>
          </motion.div>
          
          <motion.div 
            className="flex flex-col items-center text-center mb-8"
            variants={itemVariants}
          >
            <h1 className="text-3xl font-bold mb-3 text-gradient-cosmic">
              {t("Astronomy Photo Points", "天文摄影点")}
            </h1>
            <p className="text-muted-foreground max-w-xl">
              {t(
                "Discover the best locations for astrophotography near you. Filter by certified dark sky areas or algorithmically calculated spots.",
                "发现您附近最佳的天文摄影地点。按认证暗夜区域或算法计算的位置进行筛选。"
              )}
            </p>
          </motion.div>
          
          {/* User location section */}
          {!userLocation && (
            <motion.div 
              className="flex justify-center mb-8"
              variants={itemVariants}
            >
              <Button
                onClick={getPosition}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                {t("Use My Location", "使用我的位置")}
              </Button>
            </motion.div>
          )}
          
          {/* Distance filter */}
          {userLocation && (
            <motion.div 
              className="max-w-xl mx-auto mb-8 bg-cosmic-900/50 p-4 rounded-lg border border-cosmic-800"
              variants={itemVariants}
            >
              <h3 className="text-sm mb-2 font-medium text-center">
                {t("Search Radius", "搜索半径")}
              </h3>
              <DistanceRangeSlider
                currentValue={searchRadius}
                onValueChange={handleRadiusChange}
                minValue={100}
                maxValue={10000}
                stepValue={100}
              />
              {isChangingRadius && (
                <div className="text-center mt-2 text-xs text-muted-foreground flex items-center justify-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  {t("Updating results...", "正在更新结果...")}
                </div>
              )}
            </motion.div>
          )}
          
          {/* Tab toggle */}
          <motion.div 
            className="mb-6"
            variants={itemVariants}
          >
            <ViewToggle
              activeView={activeView}
              onViewChange={setActiveView}
              certifiedCount={certifiedCount}
              calculatedCount={calculatedCount}
              loading={loading}
            />
          </motion.div>
          
          {/* Content based on active view */}
          <motion.div variants={itemVariants}>
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
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PhotoPointsNearby;


import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { useCertifiedLocations } from '@/hooks/location/useCertifiedLocations';
import ViewToggle, { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';
import DistanceRangeSlider from '@/components/photoPoints/DistanceRangeSlider';
import { MapPin, Loader2, RefreshCw, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/navigation/BackButton';
import { motion } from 'framer-motion';

// Lazy load components for better initial loading performance
const DarkSkyLocations = lazy(() => import('@/components/photoPoints/DarkSkyLocations'));
const CalculatedLocations = lazy(() => import('@/components/photoPoints/CalculatedLocations'));
const useRecommendedLocations = lazy(() => 
  import('@/hooks/photoPoints/useRecommendedLocations').then(mod => ({ 
    default: mod.useRecommendedLocations 
  }))
);

const PhotoPointsNearby: React.FC = () => {
  const { t } = useLanguage();
  const { loading: locationLoading, coords, getPosition } = useGeolocation({ language: 'en' });
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('certified');
  const [searchRadius, setSearchRadius] = useState(1000);
  const [locationsData, setLocationsData] = useState({
    locations: [],
    loading: true,
    hasMore: false,
    refreshSiqsData: () => {},
    loadMore: () => {}
  });

  // Get user location from coordinates
  const userLocation = coords ? { latitude: coords.latitude, longitude: coords.longitude } : null;

  // Handle radius change with debouncing
  const [debouncedRadius, setDebouncedRadius] = useState(searchRadius);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRadius(searchRadius);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchRadius]);

  // Dynamic import of the hook based on user location
  useEffect(() => {
    if (userLocation) {
      const loadRecommendedLocations = async () => {
        try {
          // Dynamic import for code splitting
          const { useRecommendedLocations } = await import('@/hooks/photoPoints/useRecommendedLocations');
          const {
            locations,
            loading,
            hasMore,
            loadMore,
            refreshSiqsData
          } = useRecommendedLocations(userLocation, debouncedRadius, 30);
          
          setLocationsData({
            locations,
            loading,
            hasMore,
            loadMore,
            refreshSiqsData
          });
        } catch (error) {
          console.error("Error loading recommended locations:", error);
          setLocationsData(prev => ({
            ...prev,
            loading: false
          }));
        }
      };
      
      loadRecommendedLocations();
    }
  }, [userLocation, debouncedRadius]);

  // Process locations to separate certified and calculated
  const {
    certifiedLocations,
    calculatedLocations,
    certifiedCount,
    calculatedCount
  } = useCertifiedLocations(locationsData.locations, debouncedRadius);

  // Handle radius change
  const handleRadiusChange = useCallback((value: number) => {
    setSearchRadius(value);
  }, []);

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
  }, []);

  // Call getUserLocation when the component mounts
  useEffect(() => {
    if (!userLocation) {
      getPosition();
    }
  }, [getPosition, userLocation]);

  // Page title
  const pageTitle = t("Photo Points Nearby | Sky Viewer", "附近拍摄点 | 天空观测");
  
  // Animation variants for page elements (optimized for performance)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.05 // Reduced for faster animation
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 }, // Reduced y-offset for subtler animation
    visible: { opacity: 1, y: 0 }
  };
  
  return (
    <HelmetProvider>
      <div className="min-h-screen bg-cosmic-950 bg-[url('/src/assets/star-field-bg.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
        <Helmet>
          <title>{pageTitle}</title>
        </Helmet>
        
        <div className="pt-20 md:pt-28 pb-20">
          <motion.div 
            className="container mx-auto px-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Back Button */}
            <motion.div className="mb-6" variants={itemVariants}>
              <BackButton destination="/" />
            </motion.div>
            
            <motion.div className="flex flex-col items-center text-center mb-8" variants={itemVariants}>
              <h1 className="text-3xl font-bold mb-3 text-gradient">
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
              <motion.div className="flex justify-center mb-8" variants={itemVariants}>
                <Button
                  onClick={getPosition}
                  className="flex items-center gap-2 glassmorphism bg-cosmic-800/30 hover:bg-cosmic-700/40 border border-cosmic-700/30"
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
            
            {/* User location indicator and refresh button */}
            {userLocation && (
              <motion.div 
                className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8"
                variants={itemVariants}
              >
                <div className="flex items-center gap-2 glassmorphism-light px-4 py-2 rounded-lg">
                  <Locate className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">
                    {t(
                      `Location: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`,
                      `位置: ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
                    )}
                  </span>
                </div>
                
                <Button
                  onClick={() => {
                    getPosition();
                    locationsData.refreshSiqsData();
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 glassmorphism-light hover:bg-cosmic-700/40 border border-cosmic-600/30"
                  disabled={locationLoading || locationsData.loading}
                >
                  <RefreshCw className={`h-4 w-4 ${locationsData.loading ? 'animate-spin' : ''}`} />
                  {t("Refresh Data", "刷新数据")}
                </Button>
              </motion.div>
            )}
            
            {/* Distance filter */}
            {userLocation && (
              <motion.div 
                className="max-w-xl mx-auto mb-8 glassmorphism rounded-xl p-4"
                variants={itemVariants}
              >
                <DistanceRangeSlider
                  currentValue={searchRadius}
                  onValueChange={handleRadiusChange}
                  minValue={100}
                  maxValue={10000}
                  stepValue={100}
                />
              </motion.div>
            )}
            
            {/* Tab toggle */}
            <motion.div className="mb-6" variants={itemVariants}>
              <ViewToggle
                activeView={activeView}
                onViewChange={setActiveView}
                certifiedCount={certifiedCount}
                calculatedCount={calculatedCount}
                loading={locationsData.loading}
              />
            </motion.div>
            
            {/* Content based on active view */}
            <motion.div variants={itemVariants}>
              <Suspense fallback={
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              }>
                {activeView === 'certified' ? (
                  <DarkSkyLocations
                    locations={certifiedLocations}
                    loading={locationsData.loading && !locationLoading}
                  />
                ) : (
                  <CalculatedLocations
                    locations={calculatedLocations}
                    loading={locationsData.loading && !locationLoading}
                    hasMore={locationsData.hasMore}
                    onLoadMore={locationsData.loadMore}
                    onRefresh={locationsData.refreshSiqsData}
                    searchRadius={debouncedRadius}
                  />
                )}
              </Suspense>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </HelmetProvider>
  );
};

export default PhotoPointsNearby;

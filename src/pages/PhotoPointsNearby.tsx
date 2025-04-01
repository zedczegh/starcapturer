
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { useCertifiedLocations } from '@/hooks/location/useCertifiedLocations';
import ViewToggle, { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';
import DistanceRangeSlider from '@/components/photoPoints/DistanceRangeSlider';
import { Loader2 } from 'lucide-react';
import BackButton from '@/components/navigation/BackButton';
import { motion } from 'framer-motion';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import PhotoPointsHeader from '@/components/photoPoints/PhotoPointsHeader';

// Lazy load components for better initial loading performance
const DarkSkyLocations = lazy(() => import('@/components/photoPoints/DarkSkyLocations'));
const CalculatedLocations = lazy(() => import('@/components/photoPoints/CalculatedLocations'));

const PhotoPointsNearby: React.FC = () => {
  const { t } = useLanguage();
  const { loading: locationLoading, coords, getPosition } = useGeolocation({ language: 'en' });
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('certified');
  const [searchRadius, setSearchRadius] = useState(1000);
  
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

  // Use the recommended locations hook
  const {
    displayedLocations,
    loading: locationsLoading,
    hasMore,
    loadMore,
    refreshSiqsData,
    totalLocationsCount,
    setSearchRadius: setRecommendedSearchRadius
  } = useRecommendedLocations(userLocation, debouncedRadius, 30);
  
  // Process locations to separate certified and calculated
  const {
    certifiedLocations,
    calculatedLocations,
    certifiedCount,
    calculatedCount
  } = useCertifiedLocations(displayedLocations, debouncedRadius);

  // Handle radius change
  const handleRadiusChange = useCallback((value: number) => {
    setSearchRadius(value);
    setRecommendedSearchRadius(value);
  }, [setRecommendedSearchRadius]);

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
  
  // Animation variants for page elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
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
            
            <PhotoPointsHeader 
              userLocation={userLocation}
              locationLoading={locationLoading}
              locationsLoading={locationsLoading}
              getPosition={getPosition}
              refreshData={refreshSiqsData}
              variants={itemVariants}
            />
            
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
                loading={locationsLoading}
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
                    loading={locationsLoading || locationLoading}
                  />
                ) : (
                  <CalculatedLocations
                    locations={calculatedLocations}
                    loading={locationsLoading || locationLoading}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                    onRefresh={refreshSiqsData}
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

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { useCertifiedLocations } from '@/hooks/location/useCertifiedLocations';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import { currentSiqsStore } from '@/components/index/CalculatorSection';
import PhotoPointsLayout from '@/components/photoPoints/PhotoPointsLayout';
import PhotoPointsHeader from '@/components/photoPoints/PhotoPointsHeader';
import ViewToggle, { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';
import DistanceRangeSlider from '@/components/photoPoints/DistanceRangeSlider';
import PageLoader from '@/components/loaders/PageLoader';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

// Lazy load components that are not immediately visible
const DarkSkyLocations = lazy(() => import('@/components/photoPoints/DarkSkyLocations'));
const CalculatedLocations = lazy(() => import('@/components/photoPoints/CalculatedLocations'));
const PhotoPointsMap = lazy(() => import('@/components/photoPoints/map/PhotoPointsMap'));
const { usePhotoPointsMap } = require('@/hooks/photoPoints/usePhotoPointsMap');

const PhotoPointsNearby: React.FC = () => {
  // Get user location
  const { loading: locationLoading, coords, getPosition } = useGeolocation({
    enableHighAccuracy: true
  });
  
  // UI state
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('certified');
  const [initialLoad, setInitialLoad] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Get user location from coordinates
  const userLocation = coords ? { latitude: coords.latitude, longitude: coords.longitude } : null;

  // Get the current SIQS value from the store
  const currentSiqs = currentSiqsStore.getValue();

  // Set up recommended locations with userLocation
  const {
    searchRadius,
    setSearchRadius,
    locations,
    loading,
    searching,
    hasMore,
    loadMore,
    refreshSiqsData,
    canLoadMoreCalculated,
    loadMoreCalculatedLocations,
    loadMoreClickCount,
    maxLoadMoreClicks
  } = useRecommendedLocations(userLocation);

  // Process locations to separate certified and calculated
  const {
    certifiedLocations,
    calculatedLocations,
    certifiedCount,
    calculatedCount
  } = useCertifiedLocations(locations, searchRadius);

  // Set up map functionality
  const {
    mapReady,
    handleMapReady,
    handleLocationClick
  } = usePhotoPointsMap({
    userLocation,
    locations,
    searchRadius
  });

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

  // Mark initial load as complete after everything is loaded
  useEffect(() => {
    if (!loading && !locationLoading && initialLoad) {
      // Small delay to ensure all animations are complete
      const timer = setTimeout(() => {
        setInitialLoad(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, locationLoading, initialLoad]);

  // Handle loading more calculated locations with proper async handling
  const handleLoadMoreCalculated = useCallback(async () => {
    if (loadMoreCalculatedLocations) {
      await loadMoreCalculatedLocations();
    }
  }, [loadMoreCalculatedLocations]);
  
  // Determine loading state for current active view - avoid spinner flashing
  const isCurrentViewLoading = loading && 
    ((activeView === 'certified' && certifiedCount === 0) || 
     (activeView === 'calculated' && calculatedCount === 0));
  
  // Toggle between map and list view
  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);
  
  return (
    <PhotoPointsLayout>
      <PhotoPointsHeader 
        userLocation={userLocation}
        locationLoading={locationLoading}
        getPosition={getPosition}
      />
      
      {/* View toggle between map and list */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={toggleMapView}
          className="px-3 py-1 text-sm rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          {showMap ? t("Show List", "显示列表") : t("Show Map", "显示地图")}
        </button>
      </div>
      
      {/* Distance filter with better spacing */}
      {userLocation && (
        <div className="max-w-xl mx-auto mb-10 mt-6">
          <DistanceRangeSlider
            currentValue={searchRadius}
            onValueChange={handleRadiusChange}
            minValue={100}
            maxValue={10000}
            stepValue={100}
          />
        </div>
      )}
      
      {showMap ? (
        <Suspense fallback={<PageLoader />}>
          <div className="h-[600px] rounded-lg overflow-hidden border border-border">
            <PhotoPointsMap 
              userLocation={userLocation}
              locations={locations}
              searchRadius={searchRadius}
              onLocationClick={handleLocationClick}
            />
          </div>
        </Suspense>
      ) : (
        <>
          {/* Tab toggle - with stable positioning to prevent layout shifts */}
          <div className="mb-8">
            <ViewToggle
              activeView={activeView}
              onViewChange={setActiveView}
              certifiedCount={certifiedCount}
              calculatedCount={calculatedCount}
              loading={isCurrentViewLoading}
            />
          </div>
          
          {/* Content based on active view with suspense handling */}
          <Suspense fallback={<PageLoader />}>
            <div className="min-h-[300px]"> {/* Fixed height container prevents layout shift */}
              {activeView === 'certified' ? (
                <DarkSkyLocations
                  locations={certifiedLocations}
                  loading={loading && !locationLoading}
                  initialLoad={initialLoad}
                />
              ) : (
                <CalculatedLocations
                  locations={calculatedLocations}
                  loading={loading && !locationLoading}
                  hasMore={hasMore}
                  onLoadMore={loadMore}
                  onRefresh={refreshSiqsData}
                  searchRadius={searchRadius}
                  initialLoad={initialLoad}
                  onLoadMoreCalculated={handleLoadMoreCalculated}
                  canLoadMoreCalculated={canLoadMoreCalculated}
                  loadMoreClickCount={loadMoreClickCount}
                  maxLoadMoreClicks={maxLoadMoreClicks}
                />
              )}
            </div>
          </Suspense>
        </>
      )}
    </PhotoPointsLayout>
  );
};

export default PhotoPointsNearby;

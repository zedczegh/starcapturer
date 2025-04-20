
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import PhotoPointsLayout from '@/components/photoPoints/PhotoPointsLayout';
import PhotoPointsHeader from '@/components/photoPoints/PhotoPointsHeader';
import ViewToggle from '@/components/photoPoints/ViewToggle';
import DistanceRangeSlider from '@/components/photoPoints/DistanceRangeSlider';
import PhotoPointsView from '@/components/photoPoints/PhotoPointsView';
import { usePhotoPointsState } from '@/hooks/photoPoints/usePhotoPointsState';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import { useCertifiedLocations } from '@/hooks/location/useCertifiedLocations';
import { prepareLocationForNavigation } from '@/utils/locationNavigation';
import { isSiqsGreaterThan } from '@/utils/siqsHelpers';

const PhotoPointsNearby: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);
  
  const {
    activeView,
    showMap,
    initialLoad,
    locationLoading,
    effectiveLocation,
    locationInitialized,
    calculatedSearchRadius,
    currentSearchRadius,
    isTransitioning,
    handleRadiusChange,
    handleViewChange,
    handleLocationUpdate,
    handleResetLocation,
    toggleMapView
  } = usePhotoPointsState();

  // Add a debounced view change handler
  const handleSafeViewChange = useCallback((view: 'certified' | 'calculated') => {
    if (isViewTransitioning) return;
    
    setIsViewTransitioning(true);
    handleViewChange(view);
    
    // Reset transition flag after a delay
    setTimeout(() => {
      setIsViewTransitioning(false);
    }, 800);
  }, [handleViewChange, isViewTransitioning]);

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
  } = useRecommendedLocations(
    effectiveLocation, 
    currentSearchRadius
  );
  
  // Get certified and calculated locations from the hook
  const { 
    certifiedLocations, 
    calculatedLocations 
  } = useCertifiedLocations(locations);

  // Update search radius when view changes
  useEffect(() => {
    if (locationInitialized && effectiveLocation) {
      setSearchRadius(currentSearchRadius);
    }
  }, [locationInitialized, effectiveLocation, currentSearchRadius, setSearchRadius]);
  
  // Refresh SIQS data when location is initialized
  useEffect(() => {
    if (locationInitialized && effectiveLocation) {
      // Use a timeout to prevent immediate refresh which could cause freezing
      const timeoutId = setTimeout(() => {
        refreshSiqsData();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [locationInitialized, effectiveLocation, refreshSiqsData]);
  
  // Debug logging for locations
  useEffect(() => {
    if (locations.length > 0) {
      console.log(`Total locations: ${locations.length}, certified: ${certifiedLocations.length}, calculated: ${calculatedLocations.length}`);
    }
  }, [locations, certifiedLocations, calculatedLocations]);

  // Safe handler for location click with debounce
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (!location) return;
    
    try {
      const navigationData = prepareLocationForNavigation(location);
      
      if (navigationData) {
        navigate(`/location/${navigationData.locationId}`, { 
          state: navigationData.locationState 
        });
        console.log("Opening location details", navigationData.locationId);
      }
    } catch (error) {
      console.error("Error navigating to location details:", error, location);
    }
  }, [navigate]);
  
  return (
    <PhotoPointsLayout>
      <PhotoPointsHeader 
        userLocation={effectiveLocation}
        locationLoading={locationLoading}
        getPosition={handleResetLocation}
        showMapToggle={true}
        showMap={showMap}
        toggleMapView={toggleMapView}
      />
      
      <ViewToggle
        activeView={activeView}
        onViewChange={handleSafeViewChange}
        loading={loading || locationLoading || isViewTransitioning}
      />
      
      {activeView === 'calculated' && (
        <div className="max-w-xl mx-auto mb-6">
          <DistanceRangeSlider
            currentValue={calculatedSearchRadius}
            onValueChange={handleRadiusChange}
            minValue={100}
            maxValue={1000}
            stepValue={100}
            loading={loading || locationLoading}
            loadingComplete={!loading && !locationLoading}
          />
        </div>
      )}
      
      {showMap && activeView === 'calculated' && (
        <div className="mb-4 text-center text-sm text-muted-foreground">
          {t(
            "Click anywhere on the map to update your search location!",
            "点击地图上的任意位置以更新搜索位置！"
          )}
        </div>
      )}
      
      <PhotoPointsView
        showMap={showMap}
        activeView={activeView}
        initialLoad={initialLoad}
        effectiveLocation={effectiveLocation}
        certifiedLocations={certifiedLocations}
        calculatedLocations={calculatedLocations}
        searchRadius={currentSearchRadius}
        calculatedSearchRadius={calculatedSearchRadius}
        loading={loading || locationLoading}
        hasMore={hasMore}
        loadMore={loadMore}
        refreshSiqs={refreshSiqsData}
        onLocationClick={handleLocationClick}
        onLocationUpdate={handleLocationUpdate}
        canLoadMoreCalculated={canLoadMoreCalculated}
        loadMoreCalculated={loadMoreCalculatedLocations}
        loadMoreClickCount={loadMoreClickCount}
        maxLoadMoreClicks={maxLoadMoreClicks}
      />
    </PhotoPointsLayout>
  );
};

export default PhotoPointsNearby;

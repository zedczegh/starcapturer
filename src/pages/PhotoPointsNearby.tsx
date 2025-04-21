
import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
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
  
  const {
    activeView,
    showMap,
    initialLoad,
    locationLoading,
    effectiveLocation,
    locationInitialized,
    calculatedSearchRadius,
    currentSearchRadius,
    viewSwitchInProgress,
    handleRadiusChange,
    handleViewChange,
    handleLocationUpdate,
    handleResetLocation,
    toggleMapView
  } = usePhotoPointsState();

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
    maxLoadMoreClicks,
    error: locationsError
  } = useRecommendedLocations(
    effectiveLocation, 
    currentSearchRadius
  );
  
  // Get certified and calculated locations from the hook
  const { 
    certifiedLocations, 
    calculatedLocations,
    error: certifiedLocationsError
  } = useCertifiedLocations(locations);
  
  // Handle errors from location hooks
  useEffect(() => {
    if (locationsError) {
      console.error("Error loading locations:", locationsError);
      toast.error(t("Failed to load locations. Please try again.", "无法加载位置。请重试。"));
    }
    
    if (certifiedLocationsError) {
      console.error("Error processing certified locations:", certifiedLocationsError);
    }
  }, [locationsError, certifiedLocationsError, t]);

  // Update search radius when view changes, but avoid unnecessary refreshes
  useEffect(() => {
    if (locationInitialized && effectiveLocation) {
      setSearchRadius(currentSearchRadius);
      refreshSiqsData();
    }
  }, [locationInitialized, effectiveLocation, currentSearchRadius, setSearchRadius, refreshSiqsData]);
  
  // Log locations count for debugging
  useEffect(() => {
    if (locations.length > 0) {
      console.log(`Total locations before filtering: ${locations.length}`);
      const validLocations = locations.filter(loc => isSiqsGreaterThan(loc.siqs, 0) || loc.isDarkSkyReserve || loc.certification);
      console.log(`Valid locations after SIQS filtering: ${validLocations.length}`);
    }
  }, [locations]);
  
  // Get isLoading state that combines all loading states
  const isLoading = useMemo(() => {
    return loading || locationLoading || viewSwitchInProgress;
  }, [loading, locationLoading, viewSwitchInProgress]);
  
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (!location) return;
    
    try {
      const navigationData = prepareLocationForNavigation(location);
      
      if (navigationData) {
        navigate(`/location/${navigationData.locationId}`, { 
          state: navigationData.locationState 
        });
        console.log("Opening location details", navigationData.locationId);
      } else {
        throw new Error("Failed to prepare location data");
      }
    } catch (error) {
      console.error("Error navigating to location details:", error, location);
      toast.error(t("Could not open location details", "无法打开位置详细信息"));
    }
  }, [navigate, t]);
  
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
        onViewChange={handleViewChange}
        loading={isLoading} // Pass combined loading state to prevent toggle during transitions
      />
      
      {activeView === 'calculated' && (
        <div className="max-w-xl mx-auto mb-6">
          <DistanceRangeSlider
            currentValue={calculatedSearchRadius}
            onValueChange={handleRadiusChange}
            minValue={100}
            maxValue={1000}
            stepValue={100}
            loading={isLoading}
            loadingComplete={!isLoading}
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
        loading={isLoading}
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

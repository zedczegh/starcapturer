
import React, { useCallback, useEffect, useState, useMemo } from 'react';
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
  const [isViewChanging, setIsViewChanging] = useState(false);
  
  const {
    activeView,
    showMap,
    initialLoad,
    locationLoading,
    effectiveLocation,
    locationInitialized,
    calculatedSearchRadius,
    currentSearchRadius,
    handleRadiusChange,
    handleViewChange: originalHandleViewChange,
    handleLocationUpdate,
    handleResetLocation,
    toggleMapView
  } = usePhotoPointsState();

  // Add debounced view change handler to prevent rapid state changes
  const handleViewChange = useCallback((view: 'certified' | 'calculated') => {
    if (isViewChanging) return; // Prevent multiple rapid view changes
    
    setIsViewChanging(true);
    // Small delay to prevent UI from being blocked during transition
    setTimeout(() => {
      originalHandleViewChange(view);
      setTimeout(() => setIsViewChanging(false), 300);
    }, 50);
  }, [originalHandleViewChange, isViewChanging]);
  
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
  
  // Only update search radius when necessary to avoid unnecessary API calls
  useEffect(() => {
    if (locationInitialized && effectiveLocation && !isViewChanging) {
      setSearchRadius(currentSearchRadius);
    }
  }, [locationInitialized, effectiveLocation, currentSearchRadius, setSearchRadius, isViewChanging]);
  
  // Separate effect for refreshing SIQS data, with a debounce
  const refreshDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (locationInitialized && effectiveLocation && !isViewChanging && !loading) {
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current);
      }
      
      refreshDebounceRef.current = setTimeout(() => {
        refreshSiqsData();
        refreshDebounceRef.current = null;
      }, 500);
    }
    
    return () => {
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current);
      }
    };
  }, [locationInitialized, effectiveLocation, refreshSiqsData, isViewChanging, loading]);
  
  // Memoize logging function to prevent re-renders
  const logLocationCount = useCallback(() => {
    if (locations.length > 0) {
      console.log(`Total locations before filtering: ${locations.length}`);
      const validLocations = locations.filter(loc => isSiqsGreaterThan(loc.siqs, 0) || loc.isDarkSkyReserve || loc.certification);
      console.log(`Valid locations after SIQS filtering: ${validLocations.length}`);
    }
  }, [locations]);
  
  // Only run logging when locations change
  useEffect(() => {
    logLocationCount();
  }, [logLocationCount]);
  
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
        onViewChange={handleViewChange}
        loading={isViewChanging} // Show loading state during transitions
        disabled={isViewChanging} // Prevent rapid switches
      />
      
      {activeView === 'calculated' && (
        <div className="max-w-xl mx-auto mb-6">
          <DistanceRangeSlider
            currentValue={calculatedSearchRadius}
            onValueChange={handleRadiusChange}
            minValue={100}
            maxValue={1000}
            stepValue={100}
            loading={loading && !locationLoading}
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
        loading={loading && !locationLoading || isViewChanging}
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


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
import { getAllObscuraLocations } from '@/services/obscuraLocationsService';
import { getAllMountainLocations } from '@/services/mountainLocationsService';

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

  // Load obscura locations
  const [obscuraLocations, setObscuraLocations] = useState<SharedAstroSpot[]>([]);
  const [obscuraLoading, setObscuraLoading] = useState(true);

  // Load mountain locations
  const [mountainsLocations, setMountainsLocations] = useState<SharedAstroSpot[]>([]);
  const [mountainsLoading, setMountainsLoading] = useState(true);

  useEffect(() => {
    const loadObscuraLocations = async () => {
      try {
        setObscuraLoading(true);
        const rawLocations = await getAllObscuraLocations();
        
        // Remove hardcoded SIQS values to force real-time calculation
        const locationsWithoutSiqs = rawLocations.map(loc => ({
          ...loc,
          siqs: undefined,
          siqsResult: undefined
        }));
        
        setObscuraLocations(locationsWithoutSiqs);
        console.log(`Loaded ${locationsWithoutSiqs.length} obscura locations (SIQS will be calculated in real-time)`);
      } catch (error) {
        console.error("Error loading obscura locations:", error);
      } finally {
        setObscuraLoading(false);
      }
    };

    loadObscuraLocations();
  }, []);

  useEffect(() => {
    const loadMountainLocations = async () => {
      try {
        setMountainsLoading(true);
        const rawLocations = await getAllMountainLocations();
        
        // Remove hardcoded SIQS values to force real-time calculation
        const locationsWithoutSiqs = rawLocations.map(loc => ({
          ...loc,
          siqs: undefined,
          siqsResult: undefined
        }));
        
        setMountainsLocations(locationsWithoutSiqs);
        console.log(`Loaded ${locationsWithoutSiqs.length} mountain locations (SIQS will be calculated in real-time)`);
      } catch (error) {
        console.error("Error loading mountain locations:", error);
      } finally {
        setMountainsLoading(false);
      }
    };

    loadMountainLocations();
  }, []);

  // Update search radius when view changes, but avoid unnecessary refreshes
  useEffect(() => {
    if (locationInitialized && effectiveLocation) {
      setSearchRadius(currentSearchRadius);
      refreshSiqsData();
    }
  }, [locationInitialized, effectiveLocation, currentSearchRadius, setSearchRadius, refreshSiqsData]);
  
  React.useEffect(() => {
    if (locations.length > 0) {
      console.log(`Total locations before filtering: ${locations.length}`);
      const validLocations = locations.filter(loc => isSiqsGreaterThan(loc.siqs, 0) || loc.isDarkSkyReserve || loc.certification);
      console.log(`Valid locations after SIQS filtering: ${validLocations.length}`);
    }
  }, [locations]);

  // Auto-toggle to refresh markers when page opens or tab changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Photo points page visible - auto-toggling to refresh markers');
        // Quick toggle to force marker refresh
        handleViewChange(activeView === 'certified' ? 'calculated' : 'certified');
        setTimeout(() => handleViewChange(activeView), 10);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeView, handleViewChange]);
  
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

  const handleRefreshMarkers = useCallback(() => {
    console.log('🔄 Refreshing markers via double-click');
    // Quick toggle to force marker refresh
    const currentView = activeView;
    handleViewChange(currentView === 'certified' ? 'calculated' : 'certified');
    setTimeout(() => handleViewChange(currentView), 50);
  }, [activeView, handleViewChange]);
  
  
  return (
    <PhotoPointsLayout>
      <PhotoPointsHeader 
        userLocation={effectiveLocation}
        locationLoading={locationLoading}
        getPosition={handleResetLocation}
        showMapToggle={true}
        showMap={showMap}
        toggleMapView={toggleMapView}
        refreshMarkers={handleRefreshMarkers}
        viewToggle={
          <ViewToggle
            activeView={activeView}
            onViewChange={handleViewChange}
            loading={false}
          />
        }
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
        obscuraLocations={obscuraLocations}
        mountainsLocations={mountainsLocations}
        searchRadius={currentSearchRadius}
        calculatedSearchRadius={calculatedSearchRadius}
        loading={
          activeView === 'obscura' ? obscuraLoading : 
          activeView === 'mountains' ? mountainsLoading :
          (loading && !locationLoading)
        }
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

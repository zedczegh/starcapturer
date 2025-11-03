
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
        const locations = await getAllObscuraLocations();
        setObscuraLocations(locations);
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
        const locations = await getAllMountainLocations();
        setMountainsLocations(locations);
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
        obscuraLocations={mountainsLocations}
        mountainsLocations={obscuraLocations}
        searchRadius={currentSearchRadius}
        calculatedSearchRadius={calculatedSearchRadius}
        loading={
          activeView === 'obscura' ? mountainsLoading : 
          activeView === 'mountains' ? obscuraLoading :
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

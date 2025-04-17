
import React, { useCallback } from 'react';
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
import { calculateAstronomicalNight } from '@/utils/astronomy/nightTimeCalculator';

const PhotoPointsNearby: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Get state from custom hook
  const {
    activeView,
    showMap,
    initialLoad,
    locationLoading,
    effectiveLocation,
    calculatedSearchRadius,
    currentSearchRadius,
    handleRadiusChange,
    handleViewChange,
    handleLocationUpdate,
    handleResetLocation,
    toggleMapView
  } = usePhotoPointsState();

  // Fetch locations data
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

  // Process locations
  const {
    certifiedLocations,
    calculatedLocations,
    certifiedCount,
    calculatedCount
  } = useCertifiedLocations(locations);
  
  // Process astronomical night data for locations
  React.useEffect(() => {
    if (locations.length > 0) {
      // Process in batches to avoid UI freezing
      const batchSize = 10;
      let currentBatch = 0;
      const totalBatches = Math.ceil(locations.length / batchSize);
      
      console.log(`Processing astronomical night data for ${locations.length} locations in ${totalBatches} batches`);
      
      const processNextBatch = () => {
        const startIndex = currentBatch * batchSize;
        const endIndex = Math.min(startIndex + batchSize, locations.length);
        
        for (let i = startIndex; i < endIndex; i++) {
          const location = locations[i];
          if (location && location.latitude && location.longitude && 
              (!location.metadata || !location.metadata.astronomicalNight)) {
            try {
              const { start, end } = calculateAstronomicalNight(
                location.latitude, 
                location.longitude
              );
              
              // Store the data in the location object
              location.metadata = location.metadata || {};
              location.metadata.astronomicalNight = {
                start: start.toISOString(),
                end: end.toISOString(),
                formattedTime: `${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`
              };
            } catch (err) {
              console.error(`Error calculating astronomical night for location ${i}:`, err);
            }
          }
        }
        
        currentBatch++;
        if (currentBatch < totalBatches) {
          setTimeout(processNextBatch, 0);
        } else {
          console.log("Completed processing astronomical night data for all locations");
        }
      };
      
      processNextBatch();
    }
  }, [locations]);

  // Update search radius when view changes
  React.useEffect(() => {
    setSearchRadius(currentSearchRadius);
  }, [currentSearchRadius, setSearchRadius]);
  
  // Handle location click to navigate to details with improved error handling
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (!location) return;
    
    try {
      // Ensure we have astronomical night data before navigating
      if (location.latitude && location.longitude && 
          (!location.metadata || !location.metadata.astronomicalNight)) {
        try {
          const { start, end } = calculateAstronomicalNight(
            location.latitude, 
            location.longitude
          );
          
          // Store the data in the location object
          location.metadata = location.metadata || {};
          location.metadata.astronomicalNight = {
            start: start.toISOString(),
            end: end.toISOString(),
            formattedTime: `${start.toLocaleTimeString()} - ${end.toLocaleTimeString()}`
          };
        } catch (err) {
          console.error("Error calculating astronomical night before navigation:", err);
        }
      }
      
      // Use the navigation helper to prepare location data
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
        loading={loading && !locationLoading}
      />
      
      {activeView === 'calculated' && (
        <div className="max-w-xl mx-auto mb-6">
          <DistanceRangeSlider
            currentValue={calculatedSearchRadius}
            onValueChange={handleRadiusChange}
            minValue={100}
            maxValue={1000}
            stepValue={100}
          />
        </div>
      )}
      
      {showMap && (
        <div className="mb-4 text-center text-sm text-muted-foreground">
          {t(
            "Click anywhere on the map to select that location. The map will center on your current location if available.",
            "点击地图上的任意位置以选择该位置。如果可用，地图将以您当前位置为中心。"
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
        loading={loading && !locationLoading}
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

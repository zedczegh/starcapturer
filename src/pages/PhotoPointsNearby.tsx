
import React from 'react';
import PhotoPointsLayout from '@/components/photoPoints/PhotoPointsLayout';
import PhotoPointsHeader from '@/components/photoPoints/PhotoPointsHeader';
import PhotoPointsContent from '@/components/photoPoints/PhotoPointsContent';
import { usePhotoPointsNearby } from '@/hooks/photoPoints/usePhotoPointsNearby';
import { useFilteredLocations } from '@/components/photoPoints/utils/locationViewUtils';

const PhotoPointsNearby: React.FC = () => {
  const {
    locationLoading,
    userLocation,
    activeView,
    showMap,
    initialLoad,
    calculatedSearchRadius,
    searchRadius,
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
    handleRadiusChange,
    handleViewChange,
    handleLocationUpdate,
    handleResetLocation,
    toggleMapView,
  } = usePhotoPointsNearby();

  const {
    certifiedLocations,
    filteredCalculatedLocations,
  } = useFilteredLocations(
    locations,
    userLocation,
    calculatedSearchRadius,
    activeView
  );
  
  return (
    <PhotoPointsLayout>
      <PhotoPointsHeader 
        userLocation={userLocation}
        locationLoading={locationLoading}
        getPosition={handleResetLocation}
        showMapToggle={true}
        showMap={showMap}
        toggleMapView={toggleMapView}
      />
      
      <PhotoPointsContent
        userLocation={userLocation}
        activeView={activeView}
        showMap={showMap}
        handleViewChange={handleViewChange}
        calculatedSearchRadius={calculatedSearchRadius}
        handleRadiusChange={handleRadiusChange}
        certifiedLocations={certifiedLocations}
        calculatedLocations={locations.filter(loc => !loc.isDarkSkyReserve && !loc.certification)}
        filteredCalculatedLocations={filteredCalculatedLocations}
        loading={loading}
        locationLoading={locationLoading}
        initialLoad={initialLoad}
        searchRadius={searchRadius}
        handleLocationUpdate={handleLocationUpdate}
        hasMore={hasMore}
        loadMore={loadMore}
        refreshSiqsData={refreshSiqsData}
        canLoadMoreCalculated={canLoadMoreCalculated}
        loadMoreCalculatedLocations={loadMoreCalculatedLocations}
        loadMoreClickCount={loadMoreClickCount}
        maxLoadMoreClicks={maxLoadMoreClicks}
      />
    </PhotoPointsLayout>
  );
};

export default PhotoPointsNearby;

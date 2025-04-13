
import React from 'react';
import PhotoPointsLayout from '@/components/photoPoints/PhotoPointsLayout';
import PhotoPointsHeader from '@/components/photoPoints/PhotoPointsHeader';
import { usePhotoPointsNearby } from '@/hooks/photoPoints/usePhotoPointsNearby';
import { useLocationsData } from '@/hooks/photoPoints/useLocationsData';
import ViewControls from '@/components/photoPoints/controls/ViewControls';
import MapView from '@/components/photoPoints/views/MapView';
import ListView from '@/components/photoPoints/views/ListView';

const PhotoPointsNearby: React.FC = () => {
  // Get location state and handlers
  const {
    userLocation,
    locationLoading,
    activeView,
    showMap,
    initialLoad,
    calculatedSearchRadius,
    DEFAULT_CALCULATED_RADIUS,
    DEFAULT_CERTIFIED_RADIUS,
    handleViewChange,
    handleLocationUpdate,
    handleLocationClick,
    toggleMapView,
    handleResetLocation,
    handleRadiusChange
  } = usePhotoPointsNearby();
  
  // Get locations data
  const {
    locations,
    certifiedLocations,
    calculatedLocations,
    loading,
    searching,
    hasMore,
    loadMore,
    refreshSiqsData,
    canLoadMoreCalculated,
    loadMoreCalculatedLocations,
    loadMoreClickCount,
    maxLoadMoreClicks,
    searchRadius
  } = useLocationsData({
    userLocation, 
    activeView, 
    calculatedSearchRadius,
    defaultCertifiedRadius: DEFAULT_CERTIFIED_RADIUS
  });
  
  // Determine which location set to use based on active view
  const displayRadius = activeView === 'certified' ? DEFAULT_CERTIFIED_RADIUS : calculatedSearchRadius;
  
  return (
    <PhotoPointsLayout>
      <PhotoPointsHeader 
        userLocation={userLocation}
        locationLoading={locationLoading}
        getPosition={handleResetLocation}
      />
      
      <ViewControls 
        activeView={activeView}
        onViewChange={handleViewChange}
        showMap={showMap}
        onToggleMapView={toggleMapView}
        loading={loading && !locationLoading}
        calculatedSearchRadius={calculatedSearchRadius}
        onRadiusChange={handleRadiusChange}
      />
      
      {showMap ? (
        <MapView 
          userLocation={userLocation}
          locations={activeView === 'certified' ? certifiedLocations : calculatedLocations}
          certifiedLocations={certifiedLocations}
          calculatedLocations={calculatedLocations}
          activeView={activeView}
          searchRadius={displayRadius}
          onLocationClick={handleLocationClick}
          onLocationUpdate={handleLocationUpdate}
        />
      ) : (
        <ListView 
          activeView={activeView}
          locations={locations}
          certifiedLocations={certifiedLocations}
          calculatedLocations={calculatedLocations}
          userLocation={userLocation}
          calculatedSearchRadius={calculatedSearchRadius}
          loading={loading && !locationLoading}
          initialLoad={initialLoad}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onRefresh={refreshSiqsData}
          canLoadMoreCalculated={canLoadMoreCalculated}
          onLoadMoreCalculated={loadMoreCalculatedLocations}
          loadMoreClickCount={loadMoreClickCount}
          maxLoadMoreClicks={maxLoadMoreClicks}
        />
      )}
    </PhotoPointsLayout>
  );
};

export default PhotoPointsNearby;

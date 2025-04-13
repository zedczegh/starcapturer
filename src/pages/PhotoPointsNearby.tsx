
import React, { useState, useEffect, useCallback } from 'react';
import { useCertifiedLocations } from '@/hooks/location/useCertifiedLocations';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';
import PhotoPointsLayout from '@/components/photoPoints/PhotoPointsLayout';
import PhotoPointsHeader from '@/components/photoPoints/PhotoPointsHeader';
import { useNavigate } from 'react-router-dom';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService';

import PhotoPointsControls from './components/PhotoPointsControls';
import LocationContentView from './components/LocationContentView';
import { useLocationManagement } from './components/LocationManagement';

const DEFAULT_CALCULATED_RADIUS = 100; // 100km default radius for calculated locations
const DEFAULT_CERTIFIED_RADIUS = 100000; // 100000km for certified locations (effectively global)

const PhotoPointsNearby: React.FC = () => {
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('certified');
  const [initialLoad, setInitialLoad] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const navigate = useNavigate();

  const {
    locationLoading,
    effectiveLocation,
    handleLocationUpdate,
    handleResetLocation
  } = useLocationManagement();

  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState<number>(DEFAULT_CALCULATED_RADIUS);
  
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
    activeView === 'certified' ? DEFAULT_CERTIFIED_RADIUS : calculatedSearchRadius
  );

  const {
    certifiedLocations,
    calculatedLocations
  } = useCertifiedLocations(locations);

  const handleRadiusChange = useCallback((value: number) => {
    if (activeView === 'calculated') {
      setCalculatedSearchRadius(value);
      setSearchRadius(value);
    }
  }, [setSearchRadius, activeView]);
  
  const handleViewChange = useCallback((view: PhotoPointsViewMode) => {
    setActiveView(view);
    
    if (view === 'certified') {
      setSearchRadius(DEFAULT_CERTIFIED_RADIUS);
    } else {
      setSearchRadius(calculatedSearchRadius);
    }
    
    clearLocationCache();
  }, [setSearchRadius, calculatedSearchRadius]);
  
  const handleLocationClick = useCallback((location: SharedAstroSpot) => {
    if (location && location.latitude && location.longitude) {
      const locationId = location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
      navigate(`/location/${locationId}`, { 
        state: {
          id: locationId,
          name: location.name,
          chineseName: location.chineseName,
          latitude: location.latitude,
          longitude: location.longitude,
          bortleScale: location.bortleScale || 4,
          siqs: location.siqs,
          siqsResult: location.siqs ? { score: location.siqs } : undefined,
          certification: location.certification,
          isDarkSkyReserve: location.isDarkSkyReserve,
          timestamp: new Date().toISOString(),
          fromPhotoPoints: true
        } 
      });
      console.log("Opening location details", locationId);
    }
  }, [navigate]);

  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);

  useEffect(() => {
    if (activeView === 'certified') {
      setSearchRadius(DEFAULT_CERTIFIED_RADIUS);
    } else {
      setSearchRadius(calculatedSearchRadius);
    }
  }, [activeView, setSearchRadius, calculatedSearchRadius]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  const displayRadius = activeView === 'certified' ? DEFAULT_CERTIFIED_RADIUS : calculatedSearchRadius;
  
  return (
    <PhotoPointsLayout>
      <PhotoPointsHeader 
        userLocation={effectiveLocation}
        locationLoading={locationLoading}
        getPosition={handleResetLocation}
      />
      
      <PhotoPointsControls
        activeView={activeView}
        onViewChange={handleViewChange}
        calculatedSearchRadius={calculatedSearchRadius}
        onRadiusChange={handleRadiusChange}
        showMap={showMap}
        toggleMapView={toggleMapView}
        loading={loading && !locationLoading}
      />
      
      <LocationContentView
        showMap={showMap}
        effectiveLocation={effectiveLocation}
        certifiedLocations={certifiedLocations}
        calculatedLocations={calculatedLocations}
        activeView={activeView}
        displayRadius={displayRadius}
        calculatedSearchRadius={calculatedSearchRadius}
        loading={loading && !locationLoading}
        hasMore={hasMore}
        initialLoad={initialLoad}
        handleLocationClick={handleLocationClick}
        handleLocationUpdate={handleLocationUpdate}
        loadMore={loadMore}
        refreshSiqsData={refreshSiqsData}
        loadMoreCalculatedLocations={loadMoreCalculatedLocations}
        canLoadMoreCalculated={canLoadMoreCalculated}
        loadMoreClickCount={loadMoreClickCount}
        maxLoadMoreClicks={maxLoadMoreClicks}
      />
    </PhotoPointsLayout>
  );
};

export default PhotoPointsNearby;

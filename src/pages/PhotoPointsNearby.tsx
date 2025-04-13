
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { useCertifiedLocations } from '@/hooks/location/useCertifiedLocations';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import { currentSiqsStore } from '@/stores/siqsStore';
import PhotoPointsLayout from '@/components/photoPoints/PhotoPointsLayout';
import PhotoPointsHeader from '@/components/photoPoints/PhotoPointsHeader';
import ViewToggle, { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';
import DistanceRangeSlider from '@/components/photoPoints/DistanceRangeSlider';
import PageLoader from '@/components/loaders/PageLoader';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { Button } from '@/components/ui/button';
import { Map, List } from 'lucide-react';
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService';
import { calculateDistance } from '@/utils/geoUtils';

const DarkSkyLocations = lazy(() => import('@/components/photoPoints/DarkSkyLocations'));
const CalculatedLocations = lazy(() => import('@/components/photoPoints/CalculatedLocations'));
const PhotoPointsMap = lazy(() => import('@/components/photoPoints/map/PhotoPointsMap'));

const DEFAULT_CALCULATED_RADIUS = 100; // 100km default radius for calculated locations
const DEFAULT_CERTIFIED_RADIUS = 100000; // 100000km for certified locations (effectively global)

const PhotoPointsNearby: React.FC = () => {
  const { 
    loading: locationLoading, 
    coords, 
    getPosition, 
    error: locationError 
  } = useGeolocation({
    enableHighAccuracy: true,
    maximumAge: 60000, // Use cached position for 1 minute to avoid repeated calls
    timeout: 10000 // Timeout after 10 seconds
  });
  
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('certified');
  const [initialLoad, setInitialLoad] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [locationLoadAttempts, setLocationLoadAttempts] = useState(0);
  const [manualLocationOverride, setManualLocationOverride] = useState<{ latitude: number; longitude: number } | null>(null);

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  useEffect(() => {
    if (!coords && locationLoadAttempts < 3) {
      console.log("Getting user position, attempt:", locationLoadAttempts + 1);
      const timeoutId = setTimeout(() => {
        getPosition();
        setLocationLoadAttempts(prev => prev + 1);
      }, locationLoadAttempts * 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [getPosition, coords, locationLoadAttempts]);
  
  useEffect(() => {
    if (coords && !manualLocationOverride) {
      const newLocation = { latitude: coords.latitude, longitude: coords.longitude };
      setUserLocation(newLocation);
      
      try {
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
        console.log("Updated user location from geolocation:", newLocation);
      } catch (err) {
        console.error("Error saving location to localStorage:", err);
      }
    }
  }, [coords, manualLocationOverride]);
  
  useEffect(() => {
    if ((locationError || locationLoadAttempts >= 3) && !userLocation && !manualLocationOverride) {
      try {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
          const parsedLocation = JSON.parse(savedLocation);
          if (parsedLocation && typeof parsedLocation.latitude === 'number' && typeof parsedLocation.longitude === 'number') {
            setUserLocation(parsedLocation);
            console.log("Using saved location from localStorage as fallback:", parsedLocation);
          }
        }
      } catch (err) {
        console.error("Error loading saved location:", err);
      }
    }
  }, [locationError, userLocation, locationLoadAttempts, manualLocationOverride]);

  const effectiveLocation = manualLocationOverride || userLocation;

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
    calculatedLocations,
    certifiedCount,
    calculatedCount
  } = useCertifiedLocations(
    locations
  );

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
  
  const handleLocationUpdate = useCallback((latitude: number, longitude: number) => {
    const newLocation = { latitude, longitude };
    
    setManualLocationOverride(newLocation);
    setUserLocation(newLocation);
    
    try {
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
      console.log("Updated user location from map click:", newLocation);
    } catch (err) {
      console.error("Error saving location to localStorage:", err);
    }
    
    try {
      clearLocationCache();
      console.log("Cleared location cache after location change");
    } catch (err) {
      console.error("Error clearing location cache:", err);
    }
    
    refreshSiqsData();
  }, [refreshSiqsData]);

  useEffect(() => {
    if (activeView === 'certified') {
      setSearchRadius(DEFAULT_CERTIFIED_RADIUS);
    } else {
      setSearchRadius(calculatedSearchRadius);
    }
  }, [activeView, setSearchRadius, calculatedSearchRadius]);
  
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

  const handleResetLocation = useCallback(() => {
    setManualLocationOverride(null);
    if (coords) {
      const newLocation = { latitude: coords.latitude, longitude: coords.longitude };
      setUserLocation(newLocation);
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
    } else {
      getPosition();
    }
  }, [coords, getPosition]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  const locationsToShow = activeView === 'certified' ? certifiedLocations : calculatedLocations;
  
  const displayRadius = activeView === 'certified' ? DEFAULT_CERTIFIED_RADIUS : calculatedSearchRadius;
  
  const filteredCalculatedLocations = calculatedLocations.filter(loc => {
    if (!effectiveLocation) return true;
    const distance = loc.distance || calculateDistance(
      effectiveLocation.latitude,
      effectiveLocation.longitude,
      loc.latitude,
      loc.longitude
    );
    return distance <= calculatedSearchRadius;
  });
  
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
      
      {showMap ? (
        <Suspense fallback={<PageLoader />}>
          <div className="h-auto w-full rounded-lg overflow-hidden border border-border shadow-lg">
            <PhotoPointsMap 
              userLocation={effectiveLocation}
              locations={activeView === 'certified' ? certifiedLocations : calculatedLocations}
              certifiedLocations={certifiedLocations}
              calculatedLocations={calculatedLocations}
              activeView={activeView}
              searchRadius={displayRadius}
              onLocationClick={handleLocationClick}
              onLocationUpdate={handleLocationUpdate}
            />
          </div>
        </Suspense>
      ) : (
        <Suspense fallback={<PageLoader />}>
          <div className="min-h-[300px]">
            {activeView === 'certified' ? (
              <DarkSkyLocations
                locations={certifiedLocations}
                loading={loading && !locationLoading}
                initialLoad={initialLoad}
              />
            ) : (
              <CalculatedLocations
                locations={filteredCalculatedLocations}
                loading={loading && !locationLoading}
                hasMore={hasMore}
                onLoadMore={loadMore}
                onRefresh={refreshSiqsData}
                searchRadius={calculatedSearchRadius}
                initialLoad={initialLoad}
                onLoadMoreCalculated={loadMoreCalculatedLocations}
                canLoadMoreCalculated={canLoadMoreCalculated}
                loadMoreClickCount={loadMoreClickCount}
                maxLoadMoreClicks={maxLoadMoreClicks}
              />
            )}
          </div>
        </Suspense>
      )}
    </PhotoPointsLayout>
  );
};

export default PhotoPointsNearby;

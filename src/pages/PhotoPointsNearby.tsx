
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { useCertifiedLocations } from '@/hooks/location/useCertifiedLocations';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import { currentSiqsStore } from '@/components/index/CalculatorSection';
import PhotoPointsLayout from '@/components/photoPoints/PhotoPointsLayout';
import PhotoPointsHeader from '@/components/photoPoints/PhotoPointsHeader';
import ViewToggle, { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';
import DistanceRangeSlider from '@/components/photoPoints/DistanceRangeSlider';
import PageLoader from '@/components/loaders/PageLoader';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { Button } from '@/components/ui/button';
import { Map, List } from 'lucide-react';

// Lazy load components that are not immediately visible
const DarkSkyLocations = lazy(() => import('@/components/photoPoints/DarkSkyLocations'));
const CalculatedLocations = lazy(() => import('@/components/photoPoints/CalculatedLocations'));
const PhotoPointsMap = lazy(() => import('@/components/photoPoints/map/PhotoPointsMap'));

// Defaults
const DEFAULT_SEARCH_RADIUS = 1000; // 1000km default radius for calculated locations
const CERTIFIED_SEARCH_RADIUS = 10000; // No practical limit for certified locations (10000km)

const PhotoPointsNearby: React.FC = () => {
  // Get user location with high accuracy
  const { loading: locationLoading, coords, getPosition } = useGeolocation({
    enableHighAccuracy: true
  });
  
  // UI state
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('certified');
  const [initialLoad, setInitialLoad] = useState(true);
  const [showMap, setShowMap] = useState(true); // Default to map view
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Get user location from coordinates or from localStorage (home page might have saved it)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Try to get saved location from localStorage on initial load
  useEffect(() => {
    try {
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        const parsedLocation = JSON.parse(savedLocation);
        if (parsedLocation && typeof parsedLocation.latitude === 'number' && typeof parsedLocation.longitude === 'number') {
          setUserLocation(parsedLocation);
          console.log("Using saved location from localStorage:", parsedLocation);
        }
      }
    } catch (err) {
      console.error("Error loading saved location:", err);
    }
  }, []);
  
  // Update user location from coords
  useEffect(() => {
    if (coords) {
      const newLocation = { latitude: coords.latitude, longitude: coords.longitude };
      setUserLocation(newLocation);
      
      // Save to localStorage for other pages to use
      try {
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
      } catch (err) {
        console.error("Error saving location to localStorage:", err);
      }
    } else if (!userLocation) {
      // If we don't have coords and no userLocation, try to get position
      getPosition();
    }
  }, [coords, userLocation, getPosition]);

  // Set up recommended locations with userLocation
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
  } = useRecommendedLocations(userLocation, activeView === 'certified' ? CERTIFIED_SEARCH_RADIUS : DEFAULT_SEARCH_RADIUS);

  // Process locations to separate certified and calculated
  const {
    certifiedLocations,
    calculatedLocations,
    certifiedCount,
    calculatedCount
  } = useCertifiedLocations(locations, activeView === 'certified' ? CERTIFIED_SEARCH_RADIUS : searchRadius);

  // Handle radius change
  const handleRadiusChange = useCallback((value: number) => {
    setSearchRadius(value);
  }, [setSearchRadius]);
  
  // Handle location update from map click
  const handleLocationUpdate = useCallback((latitude: number, longitude: number) => {
    const newLocation = { latitude, longitude };
    setUserLocation(newLocation);
    
    // Save to localStorage for other pages to use
    try {
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
    } catch (err) {
      console.error("Error saving location to localStorage:", err);
    }
    
    toast.info(t(
      "Using selected location",
      "使用选定位置"
    ));
    
    // Refresh data with the new location
    refreshSiqsData();
  }, [refreshSiqsData, t]);

  // Call getPosition when the component mounts to get user's location
  useEffect(() => {
    // Try to get the user's location immediately if we don't have one from localStorage
    if (!userLocation) {
      getPosition();
    }
    
    // Set a small delay to mark initial load as complete
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [getPosition, userLocation]);

  // Handle loading more calculated locations
  const handleLoadMoreCalculated = useCallback(async () => {
    if (loadMoreCalculatedLocations) {
      await loadMoreCalculatedLocations();
    }
  }, [loadMoreCalculatedLocations]);
  
  // Handle click on a location marker
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
      toast.info(t("Opening location details", "正在打开位置详情"));
    }
  }, [navigate, t]);

  // Toggle between map and list view
  const toggleMapView = useCallback(() => {
    setShowMap(prev => !prev);
  }, []);

  // Effect to update the search radius based on active view
  useEffect(() => {
    // For certified locations, set a much larger search radius
    if (activeView === 'certified') {
      setSearchRadius(CERTIFIED_SEARCH_RADIUS);
    } else {
      // For calculated locations, use a more reasonable radius
      setSearchRadius(DEFAULT_SEARCH_RADIUS);
    }
  }, [activeView, setSearchRadius]);
  
  // Determine which locations to display based on the active view
  const locationsToDisplay = activeView === 'certified' ? certifiedLocations : calculatedLocations;
  
  return (
    <PhotoPointsLayout>
      <PhotoPointsHeader 
        userLocation={userLocation}
        locationLoading={locationLoading}
        getPosition={getPosition}
      />
      
      {/* Main filter section with improved toggle buttons */}
      <ViewToggle
        activeView={activeView}
        onViewChange={setActiveView}
        certifiedCount={certifiedCount}
        calculatedCount={calculatedCount}
        loading={loading && !locationLoading}
      />
      
      {/* View toggle between map and list */}
      <div className="flex justify-end mb-4">
        <Button 
          onClick={toggleMapView}
          variant="outline"
          size="sm"
          className="shadow-sm hover:bg-muted/60"
        >
          {showMap ? (
            <><List className="mr-2 h-4 w-4" /> {t("Show List", "显示列表")}</>
          ) : (
            <><Map className="mr-2 h-4 w-4" /> {t("Show Map", "显示地图")}</>
          )}
        </Button>
      </div>
      
      {/* Distance filter only for calculated view */}
      {activeView === 'calculated' && (
        <div className="max-w-xl mx-auto mb-6">
          <DistanceRangeSlider
            currentValue={searchRadius}
            onValueChange={handleRadiusChange}
            minValue={100}
            maxValue={1000}
            stepValue={100}
          />
        </div>
      )}
      
      {/* Instructions for map view */}
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
          <div className="h-[600px] rounded-lg overflow-hidden border border-border shadow-lg">
            <PhotoPointsMap 
              userLocation={userLocation}
              locations={locationsToDisplay}
              certifiedLocations={certifiedLocations}
              calculatedLocations={calculatedLocations}
              activeView={activeView}
              searchRadius={activeView === 'certified' ? CERTIFIED_SEARCH_RADIUS : searchRadius}
              onLocationClick={handleLocationClick}
              onLocationUpdate={handleLocationUpdate}
            />
          </div>
        </Suspense>
      ) : (
        <>
          {/* Content based on active view with suspense handling */}
          <Suspense fallback={<PageLoader />}>
            <div className="min-h-[300px]"> {/* Fixed height container prevents layout shift */}
              {activeView === 'certified' ? (
                <DarkSkyLocations
                  locations={certifiedLocations}
                  loading={loading && !locationLoading}
                  initialLoad={initialLoad}
                />
              ) : (
                <CalculatedLocations
                  locations={calculatedLocations}
                  loading={loading && !locationLoading}
                  hasMore={hasMore}
                  onLoadMore={loadMore}
                  onRefresh={refreshSiqsData}
                  searchRadius={searchRadius}
                  initialLoad={initialLoad}
                  onLoadMoreCalculated={handleLoadMoreCalculated}
                  canLoadMoreCalculated={canLoadMoreCalculated}
                  loadMoreClickCount={loadMoreClickCount}
                  maxLoadMoreClicks={maxLoadMoreClicks}
                />
              )}
            </div>
          </Suspense>
        </>
      )}
    </PhotoPointsLayout>
  );
};

export default PhotoPointsNearby;

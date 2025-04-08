
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
import { clearLocationCache } from '@/services/realTimeSiqsService/locationUpdateService';

// Lazy load components that are not immediately visible
const DarkSkyLocations = lazy(() => import('@/components/photoPoints/DarkSkyLocations'));
const CalculatedLocations = lazy(() => import('@/components/photoPoints/CalculatedLocations'));
const PhotoPointsMap = lazy(() => import('@/components/photoPoints/map/PhotoPointsMap'));

// Defaults
const DEFAULT_CALCULATED_RADIUS = 100; // 100km default radius for calculated locations
const DEFAULT_CERTIFIED_RADIUS = 10000; // 10000km for certified locations (no limit)

const PhotoPointsNearby: React.FC = () => {
  // Get user location with high accuracy
  const { loading: locationLoading, coords, getPosition, error: locationError } = useGeolocation({
    enableHighAccuracy: true
  });
  
  // UI state
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('certified');
  const [initialLoad, setInitialLoad] = useState(true);
  const [showMap, setShowMap] = useState(true); // Default to map view
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [locationLoadAttempts, setLocationLoadAttempts] = useState(0);
  const [manualLocationOverride, setManualLocationOverride] = useState<{ latitude: number; longitude: number } | null>(null);

  // Get user location from coordinates, prioritize fresh coords over localStorage
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Always try to get current location first, don't rely on localStorage as default
  useEffect(() => {
    getPosition();
    // We'll set a shorter timeout to retry getting position if it fails
    const retryTimeout = setTimeout(() => {
      if (!coords && locationLoadAttempts < 3) {
        console.log("Retrying to get user position...");
        getPosition();
        setLocationLoadAttempts(prev => prev + 1);
      }
    }, 2000);
    
    return () => clearTimeout(retryTimeout);
  }, [getPosition, coords, locationLoadAttempts]);
  
  // Update user location when coordinates change
  useEffect(() => {
    if (coords && !manualLocationOverride) {
      const newLocation = { latitude: coords.latitude, longitude: coords.longitude };
      setUserLocation(newLocation);
      
      // Save to localStorage for other pages to use
      try {
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
        console.log("Updated user location from geolocation:", newLocation);
      } catch (err) {
        console.error("Error saving location to localStorage:", err);
      }
    }
  }, [coords, manualLocationOverride]);
  
  // Fallback to localStorage only if geolocation fails completely
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

  // Get the actual location to use (prioritizing manual override)
  const effectiveLocation = manualLocationOverride || userLocation;

  // Track the current search radius for the active view
  const [calculatedSearchRadius, setCalculatedSearchRadius] = useState<number>(DEFAULT_CALCULATED_RADIUS);
  
  // Set up recommended locations with effectiveLocation and the appropriate radius
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

  // Process locations to separate certified and calculated
  const {
    certifiedLocations,
    calculatedLocations,
    certifiedCount,
    calculatedCount
  } = useCertifiedLocations(
    locations, 
    activeView === 'certified' ? DEFAULT_CERTIFIED_RADIUS : calculatedSearchRadius
  );

  // Handle radius change - only applies to calculated locations
  const handleRadiusChange = useCallback((value: number) => {
    if (activeView === 'calculated') {
      setCalculatedSearchRadius(value);
      setSearchRadius(value);
    }
  }, [setSearchRadius, activeView]);
  
  // Handle view toggle with proper radius adjustment
  const handleViewChange = useCallback((view: PhotoPointsViewMode) => {
    setActiveView(view);
    
    // Update the search radius based on which view is active
    if (view === 'certified') {
      setSearchRadius(DEFAULT_CERTIFIED_RADIUS);
    } else {
      // For calculated view, use the user-set calculated radius
      setSearchRadius(calculatedSearchRadius);
    }
    
    // Clear location cache when switching views
    clearLocationCache();
  }, [setSearchRadius, calculatedSearchRadius]);
  
  // Handle location update from map click - this should override any existing location
  const handleLocationUpdate = useCallback((latitude: number, longitude: number) => {
    const newLocation = { latitude, longitude };
    
    // Set the manual override which takes precedence over geolocation
    setManualLocationOverride(newLocation);
    
    // Also update userLocation for immediate UI update
    setUserLocation(newLocation);
    
    // Save to localStorage for other pages to use
    try {
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
      console.log("Updated user location from map click:", newLocation);
    } catch (err) {
      console.error("Error saving location to localStorage:", err);
    }
    
    // Clear location cache to ensure fresh data for the new location
    try {
      clearLocationCache();
      console.log("Cleared location cache after location change");
    } catch (err) {
      console.error("Error clearing location cache:", err);
    }
    
    // Force refresh of SIQS data with new location
    refreshSiqsData();
  }, [refreshSiqsData]);

  // Effect to update the search radius when active view changes
  useEffect(() => {
    // For certified locations, set a much larger search radius (unlimited)
    if (activeView === 'certified') {
      setSearchRadius(DEFAULT_CERTIFIED_RADIUS);
    } else {
      // For calculated locations, use the user selected radius
      setSearchRadius(calculatedSearchRadius);
    }
  }, [activeView, setSearchRadius, calculatedSearchRadius]);
  
  // Handle location click to navigate to details
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

  // Reset manual location override
  const handleResetLocation = useCallback(() => {
    setManualLocationOverride(null);
    if (coords) {
      const newLocation = { latitude: coords.latitude, longitude: coords.longitude };
      setUserLocation(newLocation);
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
      toast.success(t("Reset to current location", "重置为当前位置"));
    } else {
      getPosition();
      toast.info(t("Getting your location...", "获取您的位置中..."));
    }
  }, [coords, getPosition, t]);

  // Mark initial load as complete after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Determine which locations to display based on the active view
  const locationsToShow = activeView === 'certified' ? certifiedLocations : calculatedLocations;
  
  // Determine the current display radius
  const displayRadius = activeView === 'certified' ? DEFAULT_CERTIFIED_RADIUS : calculatedSearchRadius;
  
  return (
    <PhotoPointsLayout>
      <PhotoPointsHeader 
        userLocation={effectiveLocation}
        locationLoading={locationLoading}
        getPosition={handleResetLocation}
      />
      
      {/* Main filter section with improved toggle buttons */}
      <ViewToggle
        activeView={activeView}
        onViewChange={handleViewChange}
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
            currentValue={calculatedSearchRadius}
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
              userLocation={effectiveLocation}
              locations={locationsToShow}
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
        </>
      )}
    </PhotoPointsLayout>
  );
};

export default PhotoPointsNearby;

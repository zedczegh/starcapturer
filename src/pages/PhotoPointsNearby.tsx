
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useGeolocation } from '@/hooks/location/useGeolocation';
import { useCertifiedLocations } from '@/hooks/location/useCertifiedLocations';
import { useRecommendedLocations } from '@/hooks/photoPoints/useRecommendedLocations';
import { currentSiqsStore } from '@/components/index/CalculatorSection';
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2 } from 'lucide-react';
import PhotoPointsLayout from '@/components/photoPoints/PhotoPointsLayout';
import PhotoPointsHeader from '@/components/photoPoints/PhotoPointsHeader';
import ViewToggle, { PhotoPointsViewMode } from '@/components/photoPoints/ViewToggle';
import DistanceRangeSlider from '@/components/photoPoints/DistanceRangeSlider';
import PageLoader from '@/components/loaders/PageLoader';
import { useExpandSearchRadius } from '@/hooks/photoPoints/useExpandSearchRadius';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import '@/components/photoPoints/map/mapMarkers.css';

// Lazy load components that are not immediately visible
const DarkSkyLocations = lazy(() => import('@/components/photoPoints/DarkSkyLocations'));
const CalculatedLocations = lazy(() => import('@/components/photoPoints/CalculatedLocations'));
const PhotoPointsMap = lazy(() => import('@/components/photoPoints/map/PhotoPointsMap'));

// Maximum search radius allowed to prevent overloading the API
const MAX_SEARCH_RADIUS = 1000; // 1000 km

const PhotoPointsNearby: React.FC = () => {
  // Get user location
  const { loading: locationLoading, coords, getPosition } = useGeolocation({
    enableHighAccuracy: true
  });
  
  // UI state
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('certified');
  const [initialLoad, setInitialLoad] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Get user location from coordinates
  const userLocation = coords ? { latitude: coords.latitude, longitude: coords.longitude } : null;

  // Get the current SIQS value from the store
  const currentSiqs = currentSiqsStore.getValue();

  // Set up recommended locations with userLocation and enforce radius limit
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
  } = useRecommendedLocations(userLocation);

  // Process locations to separate certified and calculated
  const {
    certifiedLocations,
    calculatedLocations,
    certifiedCount,
    calculatedCount
  } = useCertifiedLocations(locations, searchRadius);

  // Listen for expand search radius events
  const handleRefresh = useCallback(() => {
    refreshSiqsData();
  }, [refreshSiqsData]);
  
  useExpandSearchRadius({ onRefresh: handleRefresh });

  // Handle radius change with limit
  const handleRadiusChange = useCallback((value: number) => {
    if (value > MAX_SEARCH_RADIUS) {
      toast.warning(
        t(
          "Search radius limited to 1000 km",
          "搜索半径限制为 1000 公里"
        ), 
        {
          description: t(
            "To prevent overloading the servers, we've limited the search radius.",
            "为防止服务器过载，我们限制了搜索半径。"
          )
        }
      );
      setSearchRadius(MAX_SEARCH_RADIUS);
    } else {
      setSearchRadius(value);
    }
  }, [setSearchRadius, t]);

  // Listen for custom radius change events
  useEffect(() => {
    const handleSetRadius = (e: CustomEvent<{ radius: number }>) => {
      if (e.detail.radius) {
        // Apply the same limit to custom radius events
        const limitedRadius = Math.min(e.detail.radius, MAX_SEARCH_RADIUS);
        setSearchRadius(limitedRadius);
        
        if (e.detail.radius > MAX_SEARCH_RADIUS) {
          toast.warning(
            t(
              "Search radius limited to 1000 km",
              "搜索半径限制为 1000 公里"
            ), 
            {
              description: t(
                "To prevent overloading the servers, we've limited the search radius.",
                "为防止服务器过载，我们限制了搜索半径。"
              )
            }
          );
        }
      }
    };
    
    document.addEventListener('set-search-radius', handleSetRadius as EventListener);
    
    return () => {
      document.removeEventListener('set-search-radius', handleSetRadius as EventListener);
    };
  }, [setSearchRadius, t]);

  // Call getUserLocation when the component mounts
  useEffect(() => {
    if (!userLocation) {
      getPosition();
    }
  }, [getPosition, userLocation]);

  // Mark initial load as complete after everything is loaded
  useEffect(() => {
    if (!loading && !locationLoading && initialLoad) {
      // Small delay to ensure all animations are complete
      const timer = setTimeout(() => {
        setInitialLoad(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, locationLoading, initialLoad]);

  // Handle loading more calculated locations with proper async handling
  const handleLoadMoreCalculated = useCallback(async () => {
    if (loadMoreCalculatedLocations) {
      await loadMoreCalculatedLocations();
    }
  }, [loadMoreCalculatedLocations]);
  
  // Determine loading state for current active view - avoid spinner flashing
  const isCurrentViewLoading = loading && 
    ((activeView === 'certified' && certifiedCount === 0) || 
     (activeView === 'calculated' && calculatedCount === 0));
     
  // Handle location selection
  const handleSelectLocation = useCallback((location: SharedAstroSpot) => {
    if (!location || !location.latitude || !location.longitude) return;
    
    const locationId = `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
    
    navigate(`/location/${locationId}`, {
      state: {
        id: locationId,
        name: location.name,
        chineseName: location.chineseName,
        latitude: location.latitude,
        longitude: location.longitude,
        bortleScale: location.bortleScale || 4,
        siqsResult: {
          score: location.siqs || 0
        },
        certification: location.certification,
        isDarkSkyReserve: location.isDarkSkyReserve,
        timestamp: new Date().toISOString(),
        fromPhotoPoints: true
      }
    });
  }, [navigate]);
  
  // Toggle between list and map view
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => prev === 'list' ? 'map' : 'list');
  }, []);
  
  return (
    <PhotoPointsLayout>
      <PhotoPointsHeader 
        userLocation={userLocation}
        locationLoading={locationLoading}
        getPosition={getPosition}
      />
      
      {/* View toggle buttons */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          {userLocation && locations.length > 0 && (
            <span>
              {t("Found", "找到")} {locations.length} {t("locations", "个位置")}
            </span>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-background/70 hover:bg-background/90 transition-all"
          onClick={toggleViewMode}
        >
          <MapPin className="h-4 w-4 mr-1.5" />
          {viewMode === 'list' 
            ? t("Show Map", "显示地图")
            : t("Show List", "显示列表")}
        </Button>
      </div>
      
      {/* Distance filter with better spacing */}
      {userLocation && (
        <div className="max-w-xl mx-auto mb-6">
          <DistanceRangeSlider
            currentValue={Math.min(searchRadius, MAX_SEARCH_RADIUS)}
            onValueChange={handleRadiusChange}
            minValue={100}
            maxValue={MAX_SEARCH_RADIUS}
            stepValue={100}
          />
          <div className="text-center mt-1 text-xs text-muted-foreground">
            {t("Search radius", "搜索半径")}: {searchRadius} km
            {searchRadius >= MAX_SEARCH_RADIUS && (
              <span className="text-amber-500 ml-1">({t("maximum", "最大值")})</span>
            )}
          </div>
        </div>
      )}
      
      {/* Map view */}
      {viewMode === 'map' && (
        <Suspense fallback={
          <div className="h-[500px] flex items-center justify-center bg-background/30 border border-border/30 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }>
          <PhotoPointsMap
            locations={locations}
            userLocation={userLocation}
            onSelectLocation={handleSelectLocation}
            loading={loading || locationLoading}
            searchRadius={searchRadius}
            currentSiqs={currentSiqs}
          />
          
          {/* Information about points on the map */}
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {t(
                "Showing locations with better viewing conditions",
                "显示观测条件更好的位置"
              )}
            </p>
            <div className="flex justify-center items-center space-x-6">
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-[#3b50ff] inline-block mr-1.5"></span>
                <span className="text-xs text-muted-foreground">
                  {t("Dark Sky Sites", "暗夜地点")}
                </span>
              </div>
              <div className="flex items-center">
                <span className="h-3 w-3 rounded-full bg-[#10b981] inline-block mr-1.5"></span>
                <span className="text-xs text-muted-foreground">
                  {t("Calculated Sites", "计算地点")}
                </span>
              </div>
            </div>
          </div>
        </Suspense>
      )}
      
      {/* List view */}
      {viewMode === 'list' && (
        <>
          {/* Tab toggle - with stable positioning to prevent layout shifts */}
          <div className="mb-8">
            <ViewToggle
              activeView={activeView}
              onViewChange={setActiveView}
              certifiedCount={certifiedCount}
              calculatedCount={calculatedCount}
              loading={isCurrentViewLoading}
            />
          </div>
          
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

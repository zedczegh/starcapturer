
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Info, Compass, Award, Filter } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import { useRecommendedLocations } from "@/hooks/photoPoints/useRecommendedLocations";
import PageLoader from "@/components/loaders/PageLoader";
import PhotoGuidelines from "@/components/photoPoints/PhotoGuidelines";
import DistanceRangeSlider from "@/components/photoPoints/DistanceRangeSlider";
import ViewToggle from "@/components/photoPoints/ViewToggle";
import CalculatedLocations from "@/components/photoPoints/CalculatedLocations";
import DarkSkyLocations from "@/components/photoPoints/DarkSkyLocations";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const PhotoPointsNearby = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [view, setView] = useState<"certified" | "calculated">("calculated");
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  // Set up geolocation
  const { 
    position, 
    loading: locationLoading, 
    error: locationError, 
    getPosition 
  } = useGeolocation();
  
  // Use recommended locations hook with user's position
  const {
    userLocation,
    setUserLocation,
    searchRadius,
    setSearchRadius,
    applyRadiusChange,
    locations,
    loading: locationsLoading,
    hasMore,
    loadMore,
    showCertifiedOnly,
    toggleCertifiedOnly,
    refreshSiqsData
  } = useRecommendedLocations(
    position ? { latitude: position.coords.latitude, longitude: position.coords.longitude } : null
  );
  
  // Set user location when position is available
  useEffect(() => {
    if (position && !userLocation) {
      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    }
  }, [position, userLocation, setUserLocation]);
  
  // Request location if not available
  useEffect(() => {
    if (!userLocation && !locationLoading && !initialLoadComplete) {
      console.log("Requesting user location for photo points");
      getPosition();
      setInitialLoadComplete(true);
    }
  }, [userLocation, locationLoading, getPosition, initialLoadComplete]);
  
  // Listen for expand search radius events
  useEffect(() => {
    const handleExpandSearchRadius = (event: any) => {
      if (event.detail && event.detail.radius) {
        setSearchRadius(event.detail.radius);
        setTimeout(() => applyRadiusChange(), 100);
      }
    };
    
    document.addEventListener('expand-search-radius', handleExpandSearchRadius);
    
    return () => {
      document.removeEventListener('expand-search-radius', handleExpandSearchRadius);
    };
  }, [setSearchRadius, applyRadiusChange]);
  
  // Hide page loader when data is ready or after timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsPageLoading(false);
    }, 2500); // Max time to wait before showing UI
    
    if (!locationLoading && userLocation) {
      setIsPageLoading(false);
      clearTimeout(timeout);
    }
    
    return () => clearTimeout(timeout);
  }, [locationLoading, userLocation]);
  
  // Computed properties for location lists
  const locationData = {
    certifiedLocations: locations.filter(loc => loc.isDarkSkyReserve || loc.certification),
    calculatedLocations: locations.filter(loc => !loc.isDarkSkyReserve && !loc.certification),
    get hasCertifiedLocations() { return this.certifiedLocations.length > 0; },
    get hasCalculatedLocations() { return this.calculatedLocations.length > 0; },
    get certifiedCount() { return this.certifiedLocations.length; },
    get calculatedCount() { return this.calculatedLocations.length; }
  };
  
  // Function to handle "Use my location" button
  const handleUseMyLocation = useCallback(() => {
    getPosition();
  }, [getPosition]);
  
  // Show loading indicator when waiting for locations
  const isLoading = locationLoading || locationsLoading;
  
  // Return page loader during initial loading
  if (isPageLoading) {
    return <PageLoader />;
  }
  
  return (
    <div className="min-h-screen bg-cosmic-950 bg-star-field">
      <div className="pt-24 pb-16 px-4 container mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary-foreground mb-2">
            {t("Photo Points Nearby", "附近的摄影点")}
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            {t(
              "Discover locations with optimal viewing conditions for astrophotography and stargazing near you.",
              "在您附近发现具有最佳观测条件的天文摄影和观星地点。"
            )}
          </p>
        </header>
        
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Button 
                onClick={handleUseMyLocation} 
                variant="outline"
                className="border-primary/40 hover:bg-cosmic-800/50"
                disabled={locationLoading}
              >
                <MapPin className="mr-2 h-4 w-4" />
                {locationLoading 
                  ? t("Getting location...", "正在获取位置...")
                  : t("Use my location", "使用我的位置")}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGuidelines(!showGuidelines)}
                className="text-muted-foreground hover:text-primary"
              >
                <Info className="mr-2 h-4 w-4" />
                {t("Photo guidelines", "摄影指南")}
              </Button>
            </div>
            
            {userLocation ? (
              <div className="mt-2 text-sm text-muted-foreground flex items-center">
                <MapPin className="h-3 w-3 mr-1 inline" />
                <span>
                  {t(
                    `Using location at ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`,
                    `使用位置坐标 ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
                  )}
                </span>
              </div>
            ) : (
              <div className="mt-2 text-sm text-yellow-400">
                {locationError
                  ? t("Location access denied. Please enable location services.", "位置访问被拒绝。请启用定位服务。")
                  : t("No location selected. Please use your current location.", "未选择位置。请使用您的当前位置。")
                }
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <DistanceRangeSlider 
              value={searchRadius} 
              onChange={setSearchRadius}
              onApply={applyRadiusChange}
            />
            
            <Button 
              variant="secondary" 
              size="sm"
              onClick={refreshSiqsData}
              disabled={isLoading || !userLocation}
              className="whitespace-nowrap"
            >
              <Compass className="mr-2 h-4 w-4" />
              {t("Refresh Data", "刷新数据")}
            </Button>
          </div>
        </div>
        
        <AnimatePresence>
          {showGuidelines && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-8"
            >
              <PhotoGuidelines />
            </motion.div>
          )}
        </AnimatePresence>
        
        {!userLocation && !locationLoading ? (
          <div className="bg-cosmic-800/40 p-8 text-center rounded-lg mb-8">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-primary/60" />
            <h2 className="text-xl font-semibold mb-2">
              {t("Location Required", "需要位置")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              {t(
                "To find photo locations near you, we need access to your current location.",
                "要找到您附近的摄影地点，我们需要访问您的当前位置。"
              )}
            </p>
            <Button 
              onClick={handleUseMyLocation}
              variant="default"
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              <MapPin className="mr-2 h-5 w-5" />
              {t("Share My Location", "分享我的位置")}
            </Button>
          </div>
        ) : (
          <>
            {isLoading && userLocation && (
              <div className="mb-6">
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-muted-foreground">
                    {t("Loading photo locations...", "正在加载摄影地点...")}
                  </span>
                  <span className="text-primary/70">
                    {t("Please wait", "请等待")}
                  </span>
                </div>
                <Progress 
                  value={isLoading ? 70 : 100} 
                  className="h-1.5 bg-cosmic-800/60"
                  colorClass="bg-primary/80"
                />
              </div>
            )}
            
            <div className="mb-8 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
              <div className="flex gap-2 items-center">
                <ViewToggle 
                  view={view} 
                  onViewChange={setView}
                  certifiedCount={locationData.certifiedCount}
                  calculatedCount={locationData.calculatedCount}
                />
                
                {view === "calculated" && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={toggleCertifiedOnly}
                    className={`text-xs border-primary/30 ${showCertifiedOnly ? 'bg-primary/10' : ''}`}
                  >
                    <Filter className="mr-1.5 h-3 w-3" />
                    {showCertifiedOnly 
                      ? t("Showing certified only", "仅显示认证地点") 
                      : t("Show all locations", "显示所有地点")}
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">
                  {locationData.certifiedCount > 0
                    ? t(
                        `${locationData.certifiedCount} certified location(s) found`,
                        `找到${locationData.certifiedCount}个认证地点`
                      )
                    : t("No certified locations found", "未找到认证地点")}
                </span>
              </div>
            </div>
            
            <Separator className="mb-8 bg-cosmic-800/60" />
            
            {view === "certified" ? (
              <DarkSkyLocations 
                locations={locationData.certifiedLocations} 
                loading={isLoading}
                isEmpty={!locationData.hasCertifiedLocations}
                searchRadius={searchRadius}
              />
            ) : (
              <CalculatedLocations 
                locations={locationData.calculatedLocations}
                loading={isLoading}
                hasMore={hasMore}
                onLoadMore={loadMore}
                onRefresh={refreshSiqsData}
                searchRadius={searchRadius}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PhotoPointsNearby;

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Loader2, AlertCircle, ThumbsUp, Rocket, Telescope, Globe, Target, Navigation, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { usePhotoPointsSearch } from "@/hooks/usePhotoPointsSearch";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import NavBar from "@/components/NavBar";
import DistanceRangeSlider from "@/components/photoPoints/DistanceRangeSlider";
import CopyLocationButton from "@/components/location/CopyLocationButton";
import ViewToggle, { PhotoPointsViewMode } from "@/components/photoPoints/ViewToggle";
import DarkSkyLocations from "@/components/photoPoints/DarkSkyLocations";
import CalculatedLocations from "@/components/photoPoints/CalculatedLocations";
import { useCertifiedLocations } from "@/hooks/location/useCertifiedLocations";
import { toast } from "sonner";

const CurrentLocationDisplay = ({ coords, loading }: { 
  coords: { latitude: number; longitude: number; name?: string } | null; 
  loading: boolean 
}) => {
  const { t, language } = useLanguage();
  
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("Getting location...", "正在获取位置...")}
      </div>
    );
  }
  
  if (!coords) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 bg-cosmic-800/40 px-3 py-1.5 rounded-full border border-cosmic-600/30"
    >
      <Navigation className="h-3.5 w-3.5 text-primary" />
      <span className="text-xs text-primary-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-40">
        {coords.name || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`}
      </span>
      <CopyLocationButton 
        latitude={coords.latitude} 
        longitude={coords.longitude}
        name={t("Current Location", "当前位置")}
        variant="ghost"
        size="icon"
        className="h-5 w-5 rounded-full hover:bg-cosmic-700/50 hover:opacity-90 ml-1 p-0 transition-all duration-300"
      />
    </motion.div>
  );
};

const PhotoPointsNearby: React.FC = () => {
  const { t, language } = useLanguage();
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const navigate = useNavigate();
  const [locationName, setLocationName] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<PhotoPointsViewMode>('certified');
  
  const { coords, getPosition, loading: geoLoading, error: geoError } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    language
  });
  
  const {
    loading,
    searching,
    searchDistance,
    setSearchDistance,
    displayedLocations,
    hasMoreLocations,
    loadMoreLocations,
    isUserInGoodLocation,
    totalLocationsCount,
    refreshLocations
  } = usePhotoPointsSearch({
    userLocation: coords,
    currentSiqs,
    maxInitialResults: 6
  });

  const { 
    certifiedLocations, 
    calculatedLocations,
    hasCertifiedLocations,
    hasCalculatedLocations,
    certifiedCount,
    calculatedCount
  } = useCertifiedLocations(displayedLocations, searchDistance);
  
  useEffect(() => {
    const handleExpandRadius = (event: any) => {
      if (event.detail && event.detail.radius) {
        setSearchDistance(event.detail.radius);
        setTimeout(() => {
          refreshLocations();
        }, 100);
      }
    };
    
    document.addEventListener('expand-search-radius', handleExpandRadius);
    
    return () => {
      document.removeEventListener('expand-search-radius', handleExpandRadius);
    };
  }, [setSearchDistance, refreshLocations]);
  
  useEffect(() => {
    if (!loading && !searching && activeView === 'certified' && !hasCertifiedLocations) {
      setActiveView('calculated');
      toast.info(
        language === 'en' 
          ? "No certified Dark Sky locations found nearby" 
          : "附近没有认证的暗夜地点",
        {
          description: language === 'en' 
            ? "Showing calculated recommendations instead" 
            : "显示系统计算的推荐位置",
          duration: 3000
        }
      );
    }
  }, [loading, searching, hasCertifiedLocations, activeView, language]);
  
  useEffect(() => {
    if (coords && !locationName) {
      try {
        const recentLocations = localStorage.getItem("astrospot_recent_locations");
        if (recentLocations) {
          const locations = JSON.parse(recentLocations);
          if (locations.length > 0) {
            setLocationName(locations[0].name);
          }
        }
      } catch (error) {
        console.error("Error getting location name:", error);
      }
    }
  }, [coords, locationName]);
  
  useEffect(() => {
    try {
      const recentLocations = localStorage.getItem("astrospot_recent_locations");
      if (recentLocations) {
        const locations = JSON.parse(recentLocations);
        if (locations.length > 0 && locations[0].siqs !== undefined) {
          setCurrentSiqs(locations[0].siqs);
          if (locations[0].name && !locationName) {
            setLocationName(locations[0].name);
          }
        }
      }
    } catch (error) {
      console.error("Error getting recent locations:", error);
    }
    
    if (!coords) {
      getPosition();
    }
  }, [coords, getPosition, locationName]);
  
  const handleViewCurrentLocation = () => {
    if (!coords) return;
    
    const locationId = `current-${Date.now()}`;
    navigate(`/location/${locationId}`, {
      state: {
        id: locationId,
        name: locationName || t("Current Location", "当前位置"),
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: new Date().toISOString(),
        fromPhotoPoints: true
      }
    });
  };

  const handleViewChange = (view: PhotoPointsViewMode) => {
    setActiveView(view);
  };
  
  const handleApplyRadiusChange = useCallback(() => {
    refreshLocations();
  }, [refreshLocations]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-cosmic-900 bg-cover bg-fixed bg-center bg-no-repeat">
      <NavBar />
      
      <div className="container mx-auto px-4 pt-24 pb-16 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Target className="h-7 w-7 text-primary" />
              {t("Photo Points Nearby", "附近拍摄点")}
            </h1>
            <CurrentLocationDisplay coords={coords ? { ...coords, name: locationName || undefined } : null} loading={geoLoading} />
          </div>
          
          <div className="flex items-center gap-3">
            {coords && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewCurrentLocation}
                className="text-primary bg-cosmic-900/40 hover:bg-cosmic-800/60 transition-colors"
              >
                <MapPin className="h-4 w-4 mr-1.5" />
                {t("View Current Location", "查看当前位置")}
              </Button>
            )}
            
            <Link to="/share-location">
              <Button 
                variant="default" 
                size="sm"
                className="bg-primary hover:bg-primary/90 transition-colors"
              >
                <Globe className="h-4 w-4 mr-1.5" />
                {t("Share New Location", "分享新位置")}
              </Button>
            </Link>
          </div>
        </div>
        
        {geoError && (
          <div className="mb-6 p-4 border border-amber-500/30 bg-amber-950/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-200">
              {t(
                "Location access error. Some features may be limited.",
                "位置访问错误。某些功能可能受限。"
              )}
              <Button
                variant="link"
                size="sm"
                onClick={() => getPosition()}
                className="px-2 text-primary"
              >
                {t("Try Again", "重试")}
              </Button>
            </p>
          </div>
        )}
        
        {isUserInGoodLocation && (
          <div className="mb-6 p-4 border border-green-500/30 bg-green-950/20 rounded-lg flex items-center gap-3">
            <ThumbsUp className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-200">
              {t(
                "Your current location has good viewing conditions!",
                "您当前的位置有良好的观测条件！"
              )}
            </p>
          </div>
        )}
        
        <div className="mb-6">
          <DistanceRangeSlider 
            distance={searchDistance} 
            setDistance={setSearchDistance}
            loading={searching}
            onAfterChange={handleApplyRadiusChange}
            maxDistance={10000}
          />
        </div>
        
        <div className="mb-6">
          <ViewToggle 
            activeView={activeView} 
            onViewChange={handleViewChange}
            certifiedCount={certifiedCount}
            calculatedCount={calculatedCount}
            loading={loading || searching}
          />
        </div>
        
        {activeView === 'certified' ? (
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-400" />
                <h2 className="text-xl font-semibold">
                  {t("Certified Dark Sky Locations", "认证暗夜地点")}
                </h2>
              </div>
              <div className="text-sm text-muted-foreground">
                {hasCertifiedLocations && (
                  <span>
                    {t("Showing", "显示")} {certifiedCount} {t("locations", "个位置")}
                  </span>
                )}
              </div>
            </div>
            
            <DarkSkyLocations 
              locations={certifiedLocations}
              loading={loading || searching}
            />
          </div>
        ) : (
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-yellow-400" />
                <h2 className="text-xl font-semibold">
                  {t("Calculated Recommendations", "计算推荐位置")}
                </h2>
              </div>
              <div className="text-sm text-muted-foreground">
                {hasCalculatedLocations && (
                  <span>
                    {t("Showing", "显示")} {calculatedLocations.length}/{calculatedCount} {t("locations", "个位置")}
                  </span>
                )}
              </div>
            </div>
            
            <CalculatedLocations 
              locations={calculatedLocations}
              loading={loading || searching}
              hasMore={hasMoreLocations}
              onLoadMore={loadMoreLocations}
              onRefresh={refreshLocations}
              searchRadius={searchDistance}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoPointsNearby;

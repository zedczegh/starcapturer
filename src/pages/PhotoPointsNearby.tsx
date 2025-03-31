
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Loader2, AlertCircle, ThumbsUp, Rocket, Telescope, Globe, Target, Navigation } from "lucide-react";
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
        {language === 'zh' && <span>加载中</span>}
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
    totalLocationsCount
  } = usePhotoPointsSearch({
    userLocation: coords,
    currentSiqs,
    maxInitialResults: 6
  });

  // Separate certified and calculated locations
  const { 
    certifiedLocations, 
    calculatedLocations,
    hasCertifiedLocations,
    hasCalculatedLocations,
    certifiedCount,
    calculatedCount
  } = useCertifiedLocations(displayedLocations);
  
  // Auto-switch to calculated view if no certified locations
  useEffect(() => {
    if (!loading && !searching && activeView === 'certified' && !hasCertifiedLocations) {
      setActiveView('calculated');
    }
  }, [loading, searching, hasCertifiedLocations, activeView]);
  
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
                className="sci-fi-btn border-primary/40 hover:bg-cosmic-800/50 hover:opacity-90 text-sm h-9 transition-all duration-300"
                onClick={handleViewCurrentLocation}
              >
                <Telescope className="h-4 w-4 mr-2" />
                {t("View Details", "查看详情")}
              </Button>
            )}
            
            <Link to="/share">
              <Button className="sci-fi-btn bg-cosmic-800/70 border-primary/30 hover:bg-primary/20 hover:opacity-90 text-sm h-9 transition-all duration-300">
                <MapPin className="h-4 w-4 mr-2" />
                {t("Share Location", "分享位置")}
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mb-8 glassmorphism p-4 rounded-xl bg-cosmic-800/30 border border-cosmic-600/30">
          <DistanceRangeSlider 
            distance={searchDistance} 
            setDistance={setSearchDistance} 
          />
        </div>
        
        {/* View Toggle for Certified vs Calculated Locations */}
        {!loading && !searching && !geoLoading && coords && (
          displayedLocations.length > 0 || isUserInGoodLocation ? (
            <div className="mb-6">
              <ViewToggle 
                activeView={activeView} 
                onViewChange={setActiveView} 
                certifiedCount={certifiedCount}
                calculatedCount={calculatedCount}
                className="max-w-md mx-auto"
              />
            </div>
          ) : null
        )}
        
        {searching && (
          <motion.div 
            className="flex justify-center py-12 flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <Globe className="h-16 w-16 text-primary animate-pulse" />
              <Rocket className="h-6 w-6 text-primary-focus absolute -top-1 -right-1 animate-ping" style={{animationDuration: "3s"}} />
            </div>
            <h2 className="text-xl font-medium text-center mt-6 mb-2">
              {t("Scanning for ideal photo points...", "正在扫描理想拍摄点...")}
            </h2>
            <p className="text-muted-foreground mt-2 text-center max-w-md text-sm">
              {t("Calculating real-time SIQS scores based on weather and light pollution data", 
                 "正在根据天气和光污染数据计算实时SIQS评分")}
            </p>
          </motion.div>
        )}
        
        {loading && !searching && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
        )}
        
        {geoLoading && !coords && (
          <div className="flex justify-center py-12 flex-col items-center">
            <div className="relative">
              <Target className="h-12 w-12 text-primary animate-pulse mb-4" />
              <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" style={{animationDuration: "2s"}}></div>
            </div>
            <h2 className="text-lg font-medium text-center mt-4">
              {t("Locating your position...", "正在定位您的位置...")}
            </h2>
            <p className="text-muted-foreground mt-2 text-center max-w-md text-sm">
              {t("We need your location to find the best photo spots near you", 
                 "我们需要您的位置来找到您附近最好的拍摄点")}
            </p>
          </div>
        )}
        
        {geoError && !coords && (
          <div className="text-center py-12 glassmorphism rounded-xl bg-cosmic-800/30 border border-destructive/30">
            <AlertCircle className="h-12 w-12 text-destructive/70 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {t("Location Access Required", "需要位置访问权限")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6 text-sm">
              {t(
                "We need your location to show nearby photo points. Please allow location access and try again.",
                "我们需要您的位置来显示附近的拍摄点。请允许位置访问并重试。"
              )}
            </p>
            <Button 
              size="lg" 
              onClick={getPosition}
              className="sci-fi-btn bg-cosmic-800/70 border-primary/30 hover:bg-primary/20"
            >
              {t("Try Again", "重试")}
            </Button>
          </div>
        )}
        
        {/* Good Location Message - Same for both views */}
        {!loading && !geoLoading && coords && isUserInGoodLocation && (
          <motion.div 
            className="text-center py-12 glassmorphism rounded-xl bg-cosmic-800/30 border border-cosmic-600/30 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="rounded-full bg-green-500/20 w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <ThumbsUp className="h-10 w-10 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {t("You're in a Great Spot!", "您所在的位置非常好！")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-2 text-sm">
              {t(
                "Your current location has excellent conditions for astrophotography!",
                "您当前的位置具有极佳的天文摄影条件！"
              )}
            </p>
            <p className="font-medium text-lg mb-6">
              {t("SIQS Score: ", "SIQS评分：")}
              <span className="text-green-400">{currentSiqs?.toFixed(1)}</span>
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="default" 
                variant="outline" 
                className="sci-fi-btn border-primary/40 hover:bg-cosmic-800/50"
                onClick={handleViewCurrentLocation}
              >
                <Telescope className="h-4 w-4 mr-2" />
                {t("View Details", "查看详情")}
              </Button>
              
              <CopyLocationButton 
                latitude={coords.latitude} 
                longitude={coords.longitude}
                name={locationName || t("Current Location", "当前位置")}
                size="default"
                className="sci-fi-btn bg-cosmic-800/70 border-primary/30 hover:bg-primary/20"
              />
            </div>
          </motion.div>
        )}
        
        {/* Conditional Content Based on View Mode */}
        {!loading && !searching && !geoLoading && coords && displayedLocations.length > 0 && (
          <>
            {activeView === 'certified' ? (
              <DarkSkyLocations 
                locations={certifiedLocations} 
                loading={loading || searching}
              />
            ) : (
              <CalculatedLocations 
                locations={calculatedLocations}
                loading={loading || searching}
                hasMore={hasMoreLocations}
                onLoadMore={loadMoreLocations}
              />
            )}
          </>
        )}
        
        {/* No recommended locations found message - only shown in calculated view */}
        {!loading && !searching && !geoLoading && coords && 
          displayedLocations.length === 0 && 
          !isUserInGoodLocation && 
          activeView === 'calculated' && (
          <div className="text-center py-12 glassmorphism rounded-xl bg-cosmic-800/30 border border-cosmic-600/30">
            <MapPin className="h-12 w-12 text-primary/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {t("No Better Photo Points Found Nearby", "附近未找到更好的拍摄点")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6 text-sm">
              {t(
                "We couldn't find locations with significantly better conditions within your search radius.",
                "在您的搜索半径内，我们未能找到条件明显更好的位置。"
              )}
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="default" 
                variant="outline" 
                className="sci-fi-btn border-primary/40 hover:bg-cosmic-800/50"
                onClick={handleViewCurrentLocation}
              >
                <Telescope className="h-4 w-4 mr-2" />
                {t("View Details", "查看详情")}
              </Button>
              
              <CopyLocationButton 
                latitude={coords.latitude} 
                longitude={coords.longitude}
                name={locationName || t("Current Location", "当前位置")}
                size="default"
                className="sci-fi-btn bg-cosmic-800/70 border-primary/30 hover:bg-primary/20"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoPointsNearby;

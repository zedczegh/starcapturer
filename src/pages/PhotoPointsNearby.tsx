
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Loader2, AlertCircle, ThumbsUp, Rocket, Telescope, Globe, Target, Navigation, Award, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { usePhotoPointsSearch } from "@/hooks/usePhotoPointsSearch";
import { usePhotoPointsLocationSelector } from "@/hooks/usePhotoPointsLocationSelector";
import NavBar from "@/components/NavBar";
import DistanceRangeSlider from "@/components/photoPoints/DistanceRangeSlider";
import PhotoLocationCard from "@/components/photoPoints/PhotoLocationCard";
import CopyLocationButton from "@/components/location/CopyLocationButton";
import DarkSkyLocationsSection from "@/components/photoPoints/DarkSkyLocationsSection";
import DarkSkyToggle from "@/components/photoPoints/DarkSkyToggle";
import { toast } from "sonner";
import MapSelector from "@/components/MapSelector";
import { Card } from "@/components/ui/card";

const CurrentLocationDisplay = ({ coords, loading, name }: { 
  coords: { latitude: number; longitude: number } | null; 
  loading: boolean;
  name?: string | null;
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
        {name || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`}
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

const LocationSelector = ({ onSelect, isLoading }: { 
  onSelect: (location: { name: string; latitude: number; longitude: number }) => void;
  isLoading: boolean;
}) => {
  const { t } = useLanguage();
  const [isMapSelectorOpen, setIsMapSelectorOpen] = useState(false);

  return (
    <Card className="p-4 mb-4 bg-cosmic-800/30 border border-cosmic-600/30">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        {t("Select Location", "选择位置")}
      </h3>
      
      <Button
        variant="secondary"
        disabled={isLoading}
        onClick={() => setIsMapSelectorOpen(true)}
        className="w-full mb-2 transition-all duration-300 bg-cosmic-800/60 hover:bg-cosmic-700/60"
      >
        <Search className="h-4 w-4 mr-2" />
        {t("Search for a Location", "搜索位置")}
      </Button>
      
      {isMapSelectorOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-cosmic-900 rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-cosmic-700">
              <h3 className="text-lg font-medium">{t("Search for a Location", "搜索位置")}</h3>
            </div>
            <div className="p-4 h-[60vh]">
              <MapSelector onSelectLocation={onSelect} />
            </div>
            <div className="p-4 border-t border-cosmic-700 flex justify-end">
              <Button 
                variant="outline"
                onClick={() => setIsMapSelectorOpen(false)}
              >
                {t("Close", "关闭")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

const PhotoPointsNearby: React.FC = () => {
  const { t, language } = useLanguage();
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const navigate = useNavigate();
  const [showDarkSkyOnly, setShowDarkSkyOnly] = useState(false);
  
  const {
    locationName,
    setLocationName,
    activeLocation,
    geoLoading,
    geoError,
    handleUseCurrentLocation,
    handleLocationSelect,
    isUsingGeolocation
  } = usePhotoPointsLocationSelector();
  
  const {
    loading,
    searching,
    searchDistance,
    setSearchDistance,
    displayedLocations,
    hasMoreLocations,
    loadMoreLocations,
    isUserInGoodLocation
  } = usePhotoPointsSearch({
    userLocation: activeLocation,
    currentSiqs,
    maxInitialResults: 6
  });
  
  const filteredLocations = showDarkSkyOnly 
    ? displayedLocations.filter(location => location.isDarkSkyReserve)
    : displayedLocations;
  
  useEffect(() => {
    if (activeLocation && !locationName) {
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
  }, [activeLocation, locationName, setLocationName]);
  
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
    
    if (!activeLocation && isUsingGeolocation) {
      handleUseCurrentLocation();
    }
  }, [activeLocation, isUsingGeolocation, handleUseCurrentLocation, locationName, setLocationName]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        when: "beforeChildren" 
      } 
    }
  };
  
  const handleViewCurrentLocation = () => {
    if (!activeLocation) return;
    
    const locationId = `current-${Date.now()}`;
    navigate(`/location/${locationId}`, {
      state: {
        id: locationId,
        name: locationName || t("Current Location", "当前位置"),
        latitude: activeLocation.latitude,
        longitude: activeLocation.longitude,
        timestamp: new Date().toISOString(),
        fromPhotoPoints: true // Add flag to indicate we're coming from PhotoPoints
      }
    });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-cosmic-900 bg-[url('/src/assets/deep-space-bg.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      <NavBar />
      
      <div className="container mx-auto px-4 pt-24 pb-16 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Target className="h-7 w-7 text-primary" />
              {t("Photo Points Nearby", "附近拍摄点")}
            </h1>
            <CurrentLocationDisplay 
              coords={activeLocation} 
              loading={geoLoading} 
              name={locationName} 
            />
          </div>
          
          <div className="flex items-center gap-3">
            {activeLocation && (
              <Button 
                variant="outline" 
                className="sci-fi-btn border-primary/40 hover:bg-cosmic-800/50 hover:opacity-90 text-sm h-9 transition-all duration-300"
                onClick={handleViewCurrentLocation}
              >
                <Telescope className="h-4 w-4 mr-2" />
                {t("View Details", "查看详情")}
              </Button>
            )}
            
            <Button
              variant="outline"
              className="sci-fi-btn border-primary/40 hover:bg-cosmic-800/50 hover:opacity-90 text-sm h-9 transition-all duration-300"
              onClick={handleUseCurrentLocation}
              disabled={geoLoading}
            >
              {geoLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              {t("Use My Location", "使用我的位置")}
            </Button>
            
            <Link to="/share">
              <Button className="sci-fi-btn bg-cosmic-800/70 border-primary/30 hover:bg-primary/20 hover:opacity-90 text-sm h-9 transition-all duration-300">
                <MapPin className="h-4 w-4 mr-2" />
                {t("Share Location", "分享位置")}
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Location Selector Card */}
        <LocationSelector 
          onSelect={handleLocationSelect}
          isLoading={loading || geoLoading}
        />
        
        <div className="mb-8 glassmorphism p-4 rounded-xl bg-cosmic-800/30 border border-cosmic-600/30">
          <DistanceRangeSlider 
            distance={searchDistance} 
            setDistance={setSearchDistance} 
          />
        </div>
        
        {/* Dark Sky Locations Section - Always show at the top if we have coords */}
        {activeLocation && !loading && !searching && !geoLoading && (
          <DarkSkyLocationsSection coordinates={activeLocation} />
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
        
        {geoLoading && !activeLocation && (
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
        
        {geoError && !activeLocation && (
          <div className="text-center py-12 glassmorphism rounded-xl bg-cosmic-800/30 border border-destructive/30">
            <AlertCircle className="h-12 w-12 text-destructive/70 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {t("Location Access Required", "需要位置访问权限")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6 text-sm">
              {t(
                "We need your location to show nearby photo points. Please allow location access and try again, or use the location selector above.",
                "我们需要您的位置来显示附近的拍摄点。请允许位置访问并重试，或使用上方的位置选择器。"
              )}
            </p>
            <Button 
              size="lg" 
              onClick={handleUseCurrentLocation}
              className="sci-fi-btn bg-cosmic-800/70 border-primary/30 hover:bg-primary/20"
            >
              {t("Try Again", "重试")}
            </Button>
          </div>
        )}
        
        {!loading && !geoLoading && activeLocation && isUserInGoodLocation && (
          <motion.div 
            className="text-center py-12 glassmorphism rounded-xl bg-cosmic-800/30 border border-cosmic-600/30"
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
                latitude={activeLocation.latitude} 
                longitude={activeLocation.longitude}
                name={locationName || t("Current Location", "当前位置")}
                size="default"
                className="sci-fi-btn bg-cosmic-800/70 border-primary/30 hover:bg-primary/20"
              />
            </div>
          </motion.div>
        )}
        
        {!loading && !searching && !geoLoading && activeLocation && displayedLocations.length === 0 && !isUserInGoodLocation && (
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
                latitude={activeLocation.latitude} 
                longitude={activeLocation.longitude}
                name={locationName || t("Current Location", "当前位置")}
                size="default"
                className="sci-fi-btn bg-cosmic-800/70 border-primary/30 hover:bg-primary/20"
              />
            </div>
          </div>
        )}
        
        {!loading && !searching && !geoLoading && activeLocation && displayedLocations.length > 0 && !isUserInGoodLocation && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <Telescope className="h-5 w-5 text-primary" />
                {t("Nearby Photo Spots", "附近拍摄点")}
              </h2>
              
              <DarkSkyToggle 
                showDarkSkyOnly={showDarkSkyOnly}
                onToggle={setShowDarkSkyOnly}
              />
            </div>
          
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredLocations.map((location, index) => (
                <PhotoLocationCard
                  key={location.id}
                  location={location}
                  index={index}
                />
              ))}
            </motion.div>
          </>
        )}
        
        {!loading && !searching && hasMoreLocations && displayedLocations.length > 0 && !isUserInGoodLocation && (
          <div className="flex justify-center mt-8">
            <Button 
              variant="outline" 
              onClick={loadMoreLocations}
              className="group sci-fi-btn border-primary/40 hover:bg-cosmic-800/50 hover:opacity-90 transition-all duration-300"
            >
              {t("Load More Locations", "加载更多位置")}
              <Rocket className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoPointsNearby;

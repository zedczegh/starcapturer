import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Loader2, AlertCircle, ThumbsUp, Plane, Radar, Navigation, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { usePhotoPointsSearch } from "@/hooks/usePhotoPointsSearch";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import NavBar from "@/components/NavBar";
import DistanceRangeSlider from "@/components/photoPoints/DistanceRangeSlider";
import PhotoLocationCard from "@/components/photoPoints/PhotoLocationCard";
import { toast } from "sonner";
import { formatLocationDistance } from "@/utils/unitConversion";

const PhotoPointsNearby: React.FC = () => {
  const { t, language } = useLanguage();
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  const navigate = useNavigate();
  
  // Get user's location
  const { coords, getPosition, loading: geoLoading, error: geoError } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    language
  });
  
  // Fetch photo points using custom hook
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
    userLocation: coords,
    currentSiqs,
    maxInitialResults: 5
  });
  
  // Get current location SIQS from localStorage on mount
  useEffect(() => {
    try {
      const recentLocations = localStorage.getItem("astrospot_recent_locations");
      if (recentLocations) {
        const locations = JSON.parse(recentLocations);
        if (locations.length > 0 && locations[0].siqs !== undefined) {
          setCurrentSiqs(locations[0].siqs);
        }
      }
    } catch (error) {
      console.error("Error getting recent locations:", error);
    }
    
    // Get user location if not already available
    if (!coords) {
      getPosition();
    }
  }, [coords, getPosition]);
  
  // Format location name for consistent display
  const formattedLocationName = useMemo(() => {
    if (!coords) return t("Unknown Location", "未知位置");
    
    // Try to get location name from localStorage recent locations
    try {
      const recentLocations = localStorage.getItem("astrospot_recent_locations");
      if (recentLocations) {
        const locations = JSON.parse(recentLocations);
        if (locations.length > 0 && locations[0].name) {
          const parts = locations[0].name.split(/,|，/);
          // Return the region/state/province part (usually second part) for consistency
          if (parts.length >= 2) {
            return parts[1].trim();
          }
          return locations[0].name;
        }
      }
    } catch (error) {
      console.error("Error parsing recent locations:", error);
    }
    
    // Fallback to region approximation
    // This is a simple approximation - you might want to use proper geocoding for a production app
    return t("Current Region", "当前区域");
  }, [coords, t]);
  
  // Animation variants
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
  
  // Handle navigation to current location details
  const handleViewCurrentLocation = () => {
    if (!coords) return;
    
    const locationId = `current-${Date.now()}`;
    navigate(`/location/${locationId}`, {
      state: {
        id: locationId,
        name: t("Current Location", "当前位置"),
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: new Date().toISOString()
      }
    });
  };
  
  // Share current location
  const handleShareCurrentLocation = () => {
    if (!coords) return;
    
    navigate("/share", {
      state: {
        latitude: coords.latitude,
        longitude: coords.longitude
      }
    });
    
    toast.success(
      t("Location prepared for sharing", "位置已准备好分享"),
      { description: t("You can now add details about this location", "您现在可以添加有关此位置的详细信息") }
    );
  };
  
  // Format coordinates for display based on language
  const formattedCoords = useMemo(() => {
    if (!coords) return "";
    
    if (language === "en") {
      // Format for English: decimal degrees with N/S, E/W indicators
      const latDir = coords.latitude >= 0 ? "N" : "S";
      const lngDir = coords.longitude >= 0 ? "E" : "W";
      return `${Math.abs(coords.latitude).toFixed(4)}° ${latDir}, ${Math.abs(coords.longitude).toFixed(4)}° ${lngDir}`;
    } else {
      // Format for Chinese: decimal degrees without indicators
      return `${coords.latitude.toFixed(4)}°, ${coords.longitude.toFixed(4)}°`;
    }
  }, [coords, language]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-cosmic-900">
      <NavBar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <MapPin className="h-8 w-8 text-primary mr-3" />
            {t("Photo Points Nearby", "附近拍摄点")}
          </h1>
          
          {/* User's Current Location Display */}
          {coords && (
            <motion.div 
              className="bg-background/20 backdrop-blur-sm p-3 rounded-lg border border-primary/20 flex items-center cursor-pointer hover:bg-primary/10 hover:scale-105 hover:border-primary/30 transition-all duration-300"
              onClick={handleViewCurrentLocation}
              whileHover={{ y: -3 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative mr-3">
                <Compass className="h-7 w-7 text-primary" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-medium">
                  {formattedLocationName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formattedCoords}
                </p>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Distance Range Slider */}
        <div className="mb-8">
          <DistanceRangeSlider 
            distance={searchDistance} 
            setDistance={setSearchDistance} 
          />
        </div>
        
        {/* Searching State */}
        {searching && (
          <motion.div 
            className="flex justify-center py-12 flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Radar className="h-16 w-16 text-primary animate-pulse mb-4" />
            <h2 className="text-xl font-medium text-center">
              {t("Searching for ideal photo points nearby...", "正在搜索附近的理想拍摄点...")}
            </h2>
            <p className="text-muted-foreground mt-2 text-center">
              {t("Calculating real-time SIQS scores based on weather and light pollution data", 
                 "正在根据天气和光污染数据计算实时SIQS评分")}
            </p>
          </motion.div>
        )}
        
        {/* Loading State (but not searching) */}
        {loading && !searching && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
        )}
        
        {/* Geolocation Loading */}
        {geoLoading && !coords && (
          <div className="flex justify-center py-12 flex-col items-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-medium text-center">
              {t("Getting your location...", "正在获取您的位置...")}
            </h2>
            <p className="text-muted-foreground mt-2 text-center">
              {t("We need your location to find the best photo spots near you", 
                 "我们需要您的位置来找到您附近最好的拍摄点")}
            </p>
          </div>
        )}
        
        {/* Geolocation Error */}
        {geoError && !coords && (
          <div className="text-center py-16 glassmorphism rounded-lg">
            <AlertCircle className="h-16 w-16 text-destructive/70 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              {t("Location Access Required", "需要位置访问权限")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              {t(
                "We need your location to show nearby photo points. Please allow location access and try again.",
                "我们需要您的位置来显示附近的拍摄点。请允许位置访问并重试。"
              )}
            </p>
            <Button size="lg" onClick={getPosition}>
              {t("Try Again", "重试")}
            </Button>
          </div>
        )}
        
        {/* User is in a good location */}
        {!loading && !geoLoading && coords && isUserInGoodLocation && (
          <motion.div 
            className="text-center py-16 glassmorphism rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="rounded-full bg-green-500/20 w-24 h-24 flex items-center justify-center mx-auto mb-4">
              <ThumbsUp className="h-12 w-12 text-green-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">
              {t("You're in a Great Spot!", "您所在的位置非常好！")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-2">
              {t(
                "Your current location has excellent conditions for astrophotography!",
                "您当前的位置具有极佳的天文摄影条件！"
              )}
            </p>
            <p className="font-medium text-xl mb-6">
              {t("SIQS Score: ", "SIQS评分：")}
              <span className="text-green-400">{currentSiqs?.toFixed(1)}</span>
            </p>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="mr-4"
              onClick={handleViewCurrentLocation}
            >
              {t("View Details", "查看详情")}
            </Button>
            <Button 
              size="lg"
              onClick={handleShareCurrentLocation}
            >
              {t("Share This Spot", "分享此位置")}
            </Button>
          </motion.div>
        )}
        
        {/* No locations found */}
        {!loading && !searching && !geoLoading && coords && displayedLocations.length === 0 && !isUserInGoodLocation && (
          <div className="text-center py-16 glassmorphism rounded-lg">
            <MapPin className="h-16 w-16 text-primary/50 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              {t("No Better Photo Points Found Nearby", "附近未找到更好的拍摄点")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              {t(
                "We couldn't find locations with significantly better conditions within your search radius.",
                "在您的搜索半径内，我们未能找到条件明显更好的位置。"
              )}
            </p>
            <Button 
              size="lg"
              onClick={handleShareCurrentLocation}
            >
              <MapPin className="h-5 w-5 mr-2" />
              {t("Share Your Spot", "分享您的拍摄点")}
            </Button>
          </div>
        )}
        
        {/* Location grid */}
        {!loading && !searching && !geoLoading && coords && displayedLocations.length > 0 && !isUserInGoodLocation && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {displayedLocations.map((location, index) => (
              <PhotoLocationCard
                key={location.id}
                location={location}
                index={index}
              />
            ))}
          </motion.div>
        )}
        
        {/* Load more button */}
        {!loading && !searching && hasMoreLocations && displayedLocations.length > 0 && !isUserInGoodLocation && (
          <div className="flex justify-center mt-8">
            <Button 
              variant="outline" 
              onClick={loadMoreLocations}
              className="group transition-all hover:bg-primary hover:text-white"
            >
              {t("Load More Locations", "加载更多位置")}
              <Plane className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoPointsNearby;

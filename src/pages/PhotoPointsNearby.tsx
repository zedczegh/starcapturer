
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Telescope, MapPin, Loader2, Camera, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import NavBar from "@/components/NavBar";
import { useLanguage } from "@/contexts/LanguageContext";
import DistanceRangeSlider from "@/components/DistanceRangeSlider";
import PhotoLocationCard from "@/components/photoPoints/PhotoLocationCard";
import { usePhotoPointSearch } from "@/hooks/usePhotoPointSearch";
import { calculateSIQS } from "@/lib/calculateSIQS";
import { motion } from "framer-motion";

const PhotoPointsNearby: React.FC = () => {
  const { language, t } = useLanguage();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentLocationSiqs, setCurrentLocationSiqs] = useState<number | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(1000); // Default to 1000km
  
  // Get user's location if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error(t("Location Access Denied", "位置访问被拒绝"), {
            description: t("We can't show nearby spots without your location.", "没有您的位置信息，我们无法显示附近的拍摄点。"),
          });
        }
      );
    }
    
    // Try to get current location SIQS from localStorage
    try {
      const recentLocations = localStorage.getItem("astrospot_recent_locations");
      if (recentLocations) {
        const locations = JSON.parse(recentLocations);
        if (locations.length > 0) {
          const recentLocation = locations[0];
          
          // If location has SIQS result already
          if (recentLocation.siqsResult && typeof recentLocation.siqsResult.score === 'number') {
            setCurrentLocationSiqs(recentLocation.siqsResult.score * 10);
          } 
          // Calculate SIQS from weather data if available
          else if (recentLocation.weatherData) {
            const siqs = calculateSIQS({
              cloudCover: recentLocation.weatherData.cloudCover,
              bortleScale: recentLocation.bortleScale || 5,
              seeingConditions: recentLocation.seeingConditions || 3,
              windSpeed: recentLocation.weatherData.windSpeed,
              humidity: recentLocation.weatherData.humidity,
              moonPhase: recentLocation.moonPhase || 0.5,
              precipitation: recentLocation.weatherData.precipitation,
              weatherCondition: recentLocation.weatherData.weatherCondition,
              aqi: recentLocation.weatherData.aqi
            });
            setCurrentLocationSiqs(siqs.score * 10);
          }
        }
      }
    } catch (error) {
      console.error("Error getting recent locations:", error);
    }
  }, [t]);

  // Use our custom hook for photo point search
  const {
    loading,
    photoPoints,
    hasMoreLocations,
    isUserInGoodLocation,
    fetchPhotoPoints,
    loadMoreLocations
  } = usePhotoPointSearch({
    userLocation,
    maxDistance,
    currentSiqs: currentLocationSiqs
  });
  
  // Fetch photo points when user location or distance changes
  useEffect(() => {
    if (userLocation) {
      fetchPhotoPoints();
    }
  }, [userLocation, fetchPhotoPoints]);
  
  // Handle distance slider change
  const handleDistanceChange = (distance: number) => {
    setMaxDistance(distance);
  };
  
  const userInLuck = isUserInGoodLocation();
  const noLocationsFound = !loading && photoPoints.length === 0 && !userInLuck;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-cosmic-900">
      <NavBar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center">
            <Telescope className="h-8 w-8 text-primary mr-3" />
            {t("Photo Points Nearby", "附近拍摄点")}
          </h1>
          <Link to="/share">
            <Button>
              <MapPin className="h-4 w-4 mr-2" />
              {t("Share New Location", "分享新位置")}
            </Button>
          </Link>
        </div>
        
        <div className="glassmorphism rounded-lg p-4 mb-8">
          <DistanceRangeSlider 
            value={maxDistance} 
            onChange={handleDistanceChange} 
          />
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
        ) : userInLuck ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 glassmorphism rounded-lg"
          >
            <ThumbsUp className="h-16 w-16 text-primary/90 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              {t("Looks like you are in luck!", "看来您很幸运！")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              {t(
                "Your current location already has an excellent SIQS score. You're in a great spot for astrophotography!",
                "您当前的位置已经有很高的SIQS评分。这是个天文摄影的绝佳地点！"
              )}
            </p>
            <div className="flex items-center justify-center text-2xl font-bold mt-2 mb-6">
              <span className="text-primary">{currentLocationSiqs?.toFixed(1)}</span>
              <span className="text-muted-foreground ml-1">/10</span>
            </div>
            <Link to="/current-location">
              <Button size="lg" className="animate-pulse">
                <Camera className="h-5 w-5 mr-2" />
                {t("View Current Location Details", "查看当前位置详情")}
              </Button>
            </Link>
          </motion.div>
        ) : noLocationsFound ? (
          <div className="text-center py-16 glassmorphism rounded-lg">
            <Telescope className="h-16 w-16 text-primary/50 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              {t("No Better Photo Points Found Nearby", "附近未找到更好的拍摄点")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              {t(
                "Try increasing your search radius or be the first to share an amazing astrophotography location in this area!",
                "尝试增加您的搜索半径，或成为第一个在此区域分享绝佳天文摄影位置的人！"
              )}
            </p>
            <Link to="/share">
              <Button size="lg">
                <MapPin className="h-5 w-5 mr-2" />
                {t("Share Your Spot", "分享您的拍摄点")}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <motion.h2 
              className="text-xl font-medium mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {t(
                `${photoPoints.length} locations with better conditions than your current spot:`,
                `${photoPoints.length} 个比您当前位置条件更好的地点：`
              )}
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photoPoints.map((point, index) => (
                <PhotoLocationCard 
                  key={point.id} 
                  point={point} 
                  index={index}
                  currentSiqs={currentLocationSiqs}
                />
              ))}
            </div>
            
            {hasMoreLocations && (
              <div className="flex justify-center mt-10">
                <Button 
                  onClick={loadMoreLocations}
                  variant="outline"
                  size="lg"
                  className="border-primary/30"
                >
                  {t("Load 5 More Locations", "加载更多5个位置")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PhotoPointsNearby;

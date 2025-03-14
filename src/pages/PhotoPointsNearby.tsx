
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Loader2, AlertCircle, ThumbsUp, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot, generateBaiduMapsUrl } from "@/lib/api/astroSpots";
import { usePhotoPointsSearch } from "@/hooks/usePhotoPointsSearch";
import { useGeolocation } from "@/hooks/location/useGeolocation";
import NavBar from "@/components/NavBar";
import DistanceRangeSlider from "@/components/photoPoints/DistanceRangeSlider";
import PhotoLocationCard from "@/components/photoPoints/PhotoLocationCard";

const PhotoPointsNearby: React.FC = () => {
  const { t, language } = useLanguage();
  const [currentSiqs, setCurrentSiqs] = useState<number | null>(null);
  
  // Get user's location
  const { coords, getPosition, loading: geoLoading, error: geoError } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    language
  });
  
  // Fetch photo points using custom hook
  const {
    loading,
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
  
  // Handle navigation to a location
  const handleNavigate = (e: React.MouseEvent, location: SharedAstroSpot) => {
    e.preventDefault(); // Prevent default link behavior
    window.open(generateBaiduMapsUrl(location.latitude, location.longitude, location.name), '_blank');
  };
  
  // Handle sharing a location
  const handleShare = (e: React.MouseEvent, location: SharedAstroSpot) => {
    e.preventDefault(); // Prevent default link behavior
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: t(`Astrophotography Spot: ${location.name}`, `天文摄影点：${location.name}`),
        text: t(
          `Check out this amazing astrophotography location: ${location.name}. SIQS: ${location.siqs?.toFixed(1) || "N/A"}`,
          `看看这个绝佳的天文摄影地点: ${location.name}. SIQS评分: ${location.siqs?.toFixed(1) || "N/A"}`
        ),
        url: window.location.origin + `/location/${location.id}`,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback to copying to clipboard
      const shareUrl = window.location.origin + `/location/${location.id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success(t("Link Copied", "链接已复制"), {
          description: t("Location link copied to clipboard!", "位置链接已复制到剪贴板！"),
        });
      });
    }
  };
  
  // Get a recommended distant location (best SIQS score outside search distance)
  const getBestDistantLocation = () => {
    if (displayedLocations.length === 0) return null;
    return displayedLocations.reduce((best, current) => 
      (current.siqs || 0) > (best.siqs || 0) ? current : best
    );
  };
  
  const bestDistantLocation = getBestDistantLocation();
  
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
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-cosmic-900">
      <NavBar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <MapPin className="h-8 w-8 text-primary mr-3" />
            {t("Photo Points Nearby", "附近拍摄点")}
          </h1>
          <Link to="/share">
            <Button>
              <MapPin className="h-4 w-4 mr-2" />
              {t("Share New Location", "分享新位置")}
            </Button>
          </Link>
        </div>
        
        {/* Distance Range Slider */}
        <div className="mb-8">
          <DistanceRangeSlider 
            distance={searchDistance} 
            setDistance={setSearchDistance} 
          />
        </div>
        
        {/* Loading State */}
        {(loading || geoLoading) && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
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
            
            <Link to="/">
              <Button size="lg" variant="outline" className="mr-4">
                {t("View Details", "查看详情")}
              </Button>
            </Link>
            <Link to="/share">
              <Button size="lg">
                {t("Share This Spot", "分享此位置")}
              </Button>
            </Link>
          </motion.div>
        )}
        
        {/* No locations found */}
        {!loading && !geoLoading && coords && displayedLocations.length === 0 && !isUserInGoodLocation && (
          <div className="text-center py-16 glassmorphism rounded-lg">
            <MapPin className="h-16 w-16 text-primary/50 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              {t("No Photo Points Found Nearby", "附近未找到拍摄点")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6">
              {t(
                "Be the first to share an astrophotography location in this area!",
                "成为第一个在这个地区分享天文摄影位置的人！"
              )}
            </p>
            <Link to="/share">
              <Button size="lg">
                <MapPin className="h-5 w-5 mr-2" />
                {t("Share Your Spot", "分享您的拍摄点")}
              </Button>
            </Link>
          </div>
        )}
        
        {/* Location grid */}
        {!loading && !geoLoading && coords && displayedLocations.length > 0 && !isUserInGoodLocation && (
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
                onNavigate={handleNavigate}
                onShare={handleShare}
                index={index}
              />
            ))}
          </motion.div>
        )}
        
        {/* Load more button */}
        {!loading && hasMoreLocations && displayedLocations.length > 0 && !isUserInGoodLocation && (
          <div className="flex justify-center mt-8">
            <Button 
              variant="outline" 
              onClick={loadMoreLocations}
              className="group"
            >
              {t("Load More Locations", "加载更多位置")}
              <Plane className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        )}
        
        {/* Distant location recommendation */}
        {!loading && !isUserInGoodLocation && currentSiqs !== null && bestDistantLocation && (
          <div className="mt-16 pt-8 border-t border-cosmic-700">
            <div className="flex items-center justify-center mb-4">
              <Plane className="h-6 w-6 text-primary mr-2" />
              <h3 className="text-2xl font-medium">
                {t("Worth the Trip", "值得前往的地点")}
              </h3>
            </div>
            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t(
                "For truly exceptional conditions, consider traveling to this top-rated location:",
                "如需真正优异的拍摄条件，可考虑前往这个顶级评分的位置："
              )}
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              <Link 
                to={`/location/${bestDistantLocation.id}`}
                className="glassmorphism p-6 rounded-lg hover:bg-background/50 transition-colors flex flex-col"
              >
                {bestDistantLocation.photoUrl && (
                  <div className="h-64 w-full overflow-hidden rounded-md mb-5">
                    <img 
                      src={bestDistantLocation.photoUrl} 
                      alt={bestDistantLocation.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-semibold text-xl">{bestDistantLocation.name}</h2>
                  <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded animate-pulse">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">{bestDistantLocation.siqs?.toFixed(1) || "N/A"}</span>
                  </div>
                </div>
                
                <p className="text-md text-muted-foreground mb-4">
                  {bestDistantLocation.description}
                </p>
                
                <Button 
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(generateBaiduMapsUrl(
                      bestDistantLocation.latitude, 
                      bestDistantLocation.longitude, 
                      bestDistantLocation.name
                    ), '_blank');
                  }}
                >
                  {t("Plan Your Trip", "规划您的行程")}
                </Button>
              </Link>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoPointsNearby;

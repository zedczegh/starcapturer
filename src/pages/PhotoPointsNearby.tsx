import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Telescope, MapPin, NavigationIcon, Share2, Loader2, Star, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getSharedAstroSpots, generateBaiduMapsUrl, SharedAstroSpot, calculateDistance } from "@/lib/api";
import NavBar from "@/components/NavBar";
import { useLanguage } from "@/contexts/LanguageContext";

const PhotoPointsNearby: React.FC = () => {
  const { language, t } = useLanguage();
  const [photoPoints, setPhotoPoints] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distantLocations, setDistantLocations] = useState<SharedAstroSpot[]>([]);
  const [nearbyLocations, setNearbyLocations] = useState<SharedAstroSpot[]>([]);
  const [currentLocationSiqs, setCurrentLocationSiqs] = useState<number | null>(null);
  const MAX_NEARBY_DISTANCE = 1000; // Max distance in km for "nearby" points
  
  useEffect(() => {
    // Get user's location if available
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
    
    // Load all shared photo points
    const fetchPhotoPoints = async () => {
      setLoading(true);
      try {
        // Use default coordinates if user location is not available
        const defaultLat = 39.9042; // Beijing
        const defaultLng = 116.4074;
        
        const points = await getSharedAstroSpots(
          userLocation?.latitude || defaultLat,
          userLocation?.longitude || defaultLng
        );
        setPhotoPoints(points);
      } catch (error) {
        console.error("Error fetching photo points:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPhotoPoints();
    
    // Try to get current location SIQS from localStorage
    try {
      const recentLocations = localStorage.getItem("astrospot_recent_locations");
      if (recentLocations) {
        const locations = JSON.parse(recentLocations);
        if (locations.length > 0) {
          // Use most recent location's SIQS
          setCurrentLocationSiqs(locations[0].siqs);
        }
      }
    } catch (error) {
      console.error("Error getting recent locations:", error);
    }
  }, [t]);

  // Calculate distance and filter locations when user location is available
  useEffect(() => {
    if (!userLocation || photoPoints.length === 0) return;
    
    const pointsWithDistance = photoPoints.map(point => ({
      ...point,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        point.latitude,
        point.longitude
      )
    }));

    // Split into nearby and distant locations
    const nearby = pointsWithDistance
      .filter(point => point.distance <= MAX_NEARBY_DISTANCE)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
    const distant = pointsWithDistance
      .filter(point => point.distance > MAX_NEARBY_DISTANCE)
      .sort((a, b) => (b.siqs || 0) - (a.siqs || 0))
      .slice(0, 5); // Top 5 distant locations with highest SIQS
    
    setNearbyLocations(nearby);
    setDistantLocations(distant);
  }, [photoPoints, userLocation]);

  const handleNavigate = (e: React.MouseEvent, point: SharedAstroSpot) => {
    e.preventDefault(); // Prevent default link behavior
    window.open(generateBaiduMapsUrl(point.latitude, point.longitude, point.name), '_blank');
  };

  const handleShare = (e: React.MouseEvent, point: SharedAstroSpot) => {
    e.preventDefault(); // Prevent default link behavior
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: t(`Astrophotography Spot: ${point.name}`, `天文摄影点：${point.name}`),
        text: t(
          `Check out this amazing astrophotography location: ${point.name}. SIQS: ${point.siqs?.toFixed(1) || "N/A"}`,
          `看看这个绝佳的天文摄影地点: ${point.name}. SIQS评分: ${point.siqs?.toFixed(1) || "N/A"}`
        ),
        url: window.location.origin + `/location/${point.id}`,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback to copying to clipboard
      const shareUrl = window.location.origin + `/location/${point.id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success(t("Link Copied", "链接已复制"), {
          description: t("Location link copied to clipboard!", "位置链接已复制到剪贴板！"),
        });
      });
    }
  };
  
  const getBestLocationForTrip = () => {
    if (distantLocations.length === 0) return null;
    return distantLocations[0]; // Return the distant location with highest SIQS
  };
  
  const formatDistance = (distance?: number) => {
    if (distance === undefined) return t("Unknown distance", "未知距离");
    
    if (distance < 1) 
      return t(`${Math.round(distance * 1000)} m away`, `距离 ${Math.round(distance * 1000)} 米`);
    if (distance < 100) 
      return t(`${Math.round(distance)} km away`, `距离 ${Math.round(distance)} 公里`);
    return t(`${Math.round(distance / 100) * 100} km away`, `距离 ${Math.round(distance / 100) * 100} 公里`);
  };

  const bestDistantLocation = getBestLocationForTrip();
  const hasGoodNearbyLocations = nearbyLocations.some(loc => 
    currentLocationSiqs === null || (loc.siqs || 0) > (currentLocationSiqs || 0)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-cosmic-900">
      <NavBar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
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
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>
        ) : nearbyLocations.length === 0 ? (
          <div className="text-center py-16 glassmorphism rounded-lg">
            <Telescope className="h-16 w-16 text-primary/50 mx-auto mb-4" />
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
            
            {bestDistantLocation && (
              <div className="mt-12 pt-8 border-t border-cosmic-700">
                <div className="flex items-center justify-center mb-4">
                  <Plane className="h-5 w-5 text-primary mr-2" />
                  <h3 className="text-xl font-medium">
                    {t("Worth the Trip", "值得前往的地点")}
                  </h3>
                </div>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                  {t(
                    "No good locations nearby, but this distant spot has excellent conditions:",
                    "附近没有理想的位置，但这个远处的地点有着极佳的观测条件："
                  )}
                </p>
                
                <Link 
                  to={`/location/${bestDistantLocation.id}`}
                  className="glassmorphism p-4 rounded-lg hover:bg-background/50 transition-colors flex flex-col max-w-md mx-auto"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="font-semibold text-lg">{bestDistantLocation.name}</h2>
                    <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="font-medium text-sm">{bestDistantLocation.siqs?.toFixed(1) || "N/A"}</span>
                    </div>
                  </div>
                  
                  {bestDistantLocation.photoUrl && (
                    <div className="h-48 w-full overflow-hidden rounded-md mb-4">
                      <img 
                        src={bestDistantLocation.photoUrl} 
                        alt={bestDistantLocation.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {bestDistantLocation.description}
                  </p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-xs text-primary-foreground/70">
                      {t("By", "拍摄者：")} {bestDistantLocation.photographer || t("Unknown", "未知")}
                    </div>
                    <div className="text-xs font-medium bg-background/30 px-2 py-1 rounded-full">
                      {formatDistance(bestDistantLocation.distance)}
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyLocations.map((point) => (
                <Link 
                  key={point.id} 
                  to={`/location/${point.id}`}
                  className="glassmorphism p-4 rounded-lg hover:bg-background/50 transition-colors flex flex-col h-full"
                >
                  {point.photoUrl && (
                    <div className="h-48 w-full overflow-hidden rounded-md mb-4">
                      <img 
                        src={point.photoUrl} 
                        alt={point.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="font-semibold text-lg">{point.name}</h2>
                    <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="font-medium text-sm">{point.siqs?.toFixed(1) || "N/A"}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow">
                    {point.description}
                  </p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-xs text-primary-foreground/70">
                      {t("By", "拍摄者：")} {point.photographer || t("Unknown", "未知")}
                    </div>
                    {point.distance !== undefined && (
                      <div className="text-xs font-medium bg-background/30 px-2 py-1 rounded-full">
                        {formatDistance(point.distance)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-auto">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={(e) => handleNavigate(e, point)}
                          >
                            <NavigationIcon className="h-3.5 w-3.5 mr-1.5" />
                            {t("Navigate", "导航")}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("Get directions to this location", "获取到此位置的导航")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={(e) => handleShare(e, point)}
                          >
                            <Share2 className="h-3.5 w-3.5 mr-1.5" />
                            {t("Share", "分享")}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t("Share this location with others", "与他人分享此位置")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </Link>
              ))}
            </div>
            
            {!hasGoodNearbyLocations && bestDistantLocation && (
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
                
                <Link 
                  to={`/location/${bestDistantLocation.id}`}
                  className="glassmorphism p-6 rounded-lg hover:bg-background/50 transition-colors flex flex-col max-w-2xl mx-auto"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="font-semibold text-xl">{bestDistantLocation.name}</h2>
                    <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-medium">{bestDistantLocation.siqs?.toFixed(1) || "N/A"}</span>
                    </div>
                  </div>
                  
                  {bestDistantLocation.photoUrl && (
                    <div className="h-64 w-full overflow-hidden rounded-md mb-5">
                      <img 
                        src={bestDistantLocation.photoUrl} 
                        alt={bestDistantLocation.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <p className="text-md text-muted-foreground mb-4">
                    {bestDistantLocation.description}
                  </p>
                  
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-primary-foreground/70">
                      {t("By", "拍摄者：")} {bestDistantLocation.photographer || t("Unknown", "未知")}
                    </div>
                    <div className="text-sm font-medium bg-background/30 px-3 py-1 rounded-full">
                      {formatDistance(bestDistantLocation.distance)}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      className="w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(generateBaiduMapsUrl(bestDistantLocation.latitude, bestDistantLocation.longitude, bestDistantLocation.name), '_blank');
                      }}
                    >
                      <NavigationIcon className="h-4 w-4 mr-2" />
                      {t("Plan Your Trip", "规划您的行程")}
                    </Button>
                  </div>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PhotoPointsNearby;

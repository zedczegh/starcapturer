
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Telescope, Loader2, Star, MapPin, NavigationIcon, Share2 } from "lucide-react";
import { toast } from "sonner";
import { getRecommendedPhotoPoints, generateBaiduMapsUrl, SharedAstroSpot } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface RecommendedPhotoPointsProps {
  onSelectPoint: (point: SharedAstroSpot) => void;
  className?: string;
  userLocation?: { latitude: number; longitude: number } | null;
}

const RecommendedPhotoPoints: React.FC<RecommendedPhotoPointsProps> = ({ 
  onSelectPoint,
  className,
  userLocation
}) => {
  const { language, t } = useLanguage();
  const [recommendedPoints, setRecommendedPoints] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPoints = async () => {
      if (!userLocation) return;
      
      setLoading(true);
      try {
        const points = await getRecommendedPhotoPoints(
          userLocation.latitude,
          userLocation.longitude
        );
        setRecommendedPoints(points);
      } catch (error) {
        console.error("Error fetching recommended points:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPoints();
  }, [userLocation]);

  const handleSelectPoint = (point: SharedAstroSpot) => {
    onSelectPoint(point);
    toast.success(t("Photo Point Selected", "已选择拍摄点"), {
      description: t(`Selected ${point.name}`, `已选择 ${point.name}`),
    });
  };

  const handleNavigate = (e: React.MouseEvent, point: SharedAstroSpot) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    window.open(generateBaiduMapsUrl(point.latitude, point.longitude, point.name), '_blank');
  };

  const handleShare = (e: React.MouseEvent, point: SharedAstroSpot) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    
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

  const formatDistance = (distance?: number) => {
    if (distance === undefined) return t("Unknown distance", "未知距离");
    
    if (distance < 1) 
      return t(`${Math.round(distance * 1000)} m away`, `距离 ${Math.round(distance * 1000)} 米`);
    if (distance < 100) 
      return t(`${Math.round(distance)} km away`, `距离 ${Math.round(distance)} 公里`);
    return t(`${Math.round(distance / 100) * 100} km away`, `距离 ${Math.round(distance / 100) * 100} 公里`);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Telescope className="h-5 w-5 text-primary" />
          {t("Recommended Photo Points", "推荐拍摄点")}
          {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </h3>
        <Link to="/photo-points">
          <Button variant="link" size="sm" className="text-primary">
            {t("View All Points", "查看所有拍摄点")}
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {recommendedPoints.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            {t("No photo points found near your location.", "在您附近未找到拍摄点。")}
          </div>
        ) : (
          recommendedPoints.map((point) => (
            <div 
              key={point.id}
              className="glassmorphism p-3 rounded-lg cursor-pointer hover:bg-background/50 transition-colors"
              onClick={() => handleSelectPoint(point)}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm">{point.name}</h4>
                <div className="flex items-center">
                  <Star className="h-3 w-3 text-yellow-400 mr-1" fill="#facc15" />
                  <span className="text-xs font-medium">{point.siqs?.toFixed(1) || "N/A"}</span>
                </div>
              </div>
              
              {point.photoUrl && (
                <div className="mb-2 h-24 w-full overflow-hidden rounded-md">
                  <img 
                    src={point.photoUrl} 
                    alt={point.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{point.description}</p>
              
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-primary-foreground/70">
                  {t("By ", "拍摄者：")} {point.photographer || t("Unknown", "未知")}
                </div>
                {point.distance !== undefined && (
                  <div className="text-xs font-medium">
                    {formatDistance(point.distance)}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 mt-2">
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
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecommendedPhotoPoints;


import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Telescope, Loader2, Star, MapPin } from "lucide-react";
import { toast } from "sonner";
import { getRecommendedPhotoPoints, SharedAstroSpot } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
      description: t(`Selected ${language === 'en' ? point.name : (point.chineseName || point.name)}`, 
                    `已选择 ${language === 'en' ? point.name : (point.chineseName || point.name)}`),
    });
  };

  const formatDistance = (distance?: number) => {
    if (distance === undefined) return t("Unknown distance", "未知距离");
    
    if (distance < 1) 
      return t(`${Math.round(distance * 1000)} m away`, `距离 ${Math.round(distance * 1000)} 米`);
    if (distance < 100) 
      return t(`${Math.round(distance)} km away`, `距离 ${Math.round(distance)} 公里`);
    return t(`${Math.round(distance / 100) * 100} km away`, `距离 ${Math.round(distance / 100) * 100} 公里`);
  };
  
  const handleViewDetails = (point: SharedAstroSpot) => {
    navigate(`/location/${point.id}`, {
      state: {
        id: point.id,
        name: language === 'en' ? point.name : (point.chineseName || point.name),
        latitude: point.latitude,
        longitude: point.longitude,
        bortleScale: point.bortleScale,
        timestamp: new Date().toISOString()
      }
    });
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
            {loading 
              ? t("Searching for photo points...", "正在搜索拍摄点...")
              : t("No photo points found near your location.", "在您附近未找到拍摄点。")}
          </div>
        ) : (
          recommendedPoints.map((point) => (
            <div 
              key={point.id}
              className="glassmorphism p-3 rounded-lg cursor-pointer hover:bg-background/50 transition-colors"
              onClick={() => {
                handleSelectPoint(point);
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm">
                  {language === 'en' ? point.name : (point.chineseName || point.name)}
                </h4>
                <div className="flex items-center">
                  <Star className="h-3 w-3 text-yellow-400 mr-1" fill="#facc15" />
                  <span className="text-xs font-medium">{point.siqs?.toFixed(1) || "N/A"}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
                  <span className="text-xs text-muted-foreground">
                    {formatDistance(point.distance)}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 text-xs px-2 text-primary hover:text-primary-focus"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(point);
                  }}
                >
                  {t("View", "查看")}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecommendedPhotoPoints;

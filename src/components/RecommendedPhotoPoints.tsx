import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Telescope, Loader2, Star, MapPin, Award } from "lucide-react";
import { toast } from "sonner";
import { getRecommendedPhotoPoints } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots"; 
import CopyLocationButton from "@/components/location/CopyLocationButton";
import { formatSIQSScore } from "@/utils/geoUtils";
import { saveLocationFromPhotoPoints } from "@/utils/locationStorage";
import { findLocationsWithinRadius } from "@/services/locationSearchService";
import { batchCalculateSiqs } from "@/services/realTimeSiqsService";

interface RecommendedPhotoPointsProps {
  onSelectPoint: (point: SharedAstroSpot) => void;
  className?: string;
  userLocation?: { latitude: number; longitude: number } | null;
  hideEmptyMessage?: boolean;
  preferCertified?: boolean;
}

const RecommendedPhotoPoints: React.FC<RecommendedPhotoPointsProps> = ({ 
  onSelectPoint,
  className,
  userLocation,
  hideEmptyMessage = false,
  preferCertified = true
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
        const radius = 200;
        const points = await findLocationsWithinRadius(
          userLocation.latitude,
          userLocation.longitude,
          radius,
          false
        );
        
        if (points && points.length > 0) {
          const pointsWithSiqs = await batchCalculateSiqs(points);
          
          let filteredPoints = pointsWithSiqs;
          if (preferCertified) {
            const certifiedPoints = filteredPoints.filter(p => p.isDarkSkyReserve || p.certification);
            filteredPoints = certifiedPoints.length > 0 ? certifiedPoints : filteredPoints;
          }
          
          filteredPoints.sort((a, b) => (b.siqs || 0) - (a.siqs || 0));
          
          setRecommendedPoints(filteredPoints.slice(0, 5));
        } else {
          setRecommendedPoints([]);
        }
      } catch (error) {
        console.error("Error fetching recommended points:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPoints();
  }, [userLocation, preferCertified]);

  const handleSelectPoint = (point: SharedAstroSpot) => {
    onSelectPoint(point);
    const pointName = language === 'en' ? point.name : (point.chineseName || point.name);
    
    toast.success(t("Photo Point Selected", "已选择拍摄点"), {
      description: t(`Selected ${pointName}`, `已选择 ${pointName}`),
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
    const pointName = language === 'en' ? point.name : (point.chineseName || point.name);
    
    const locationData = {
      id: point.id,
      name: pointName,
      latitude: point.latitude,
      longitude: point.longitude,
      bortleScale: point.bortleScale,
      timestamp: new Date().toISOString(),
      fromPhotoPoints: true,
      isDarkSkyReserve: point.isDarkSkyReserve,
      certification: point.certification
    };
    
    saveLocationFromPhotoPoints(locationData);
    
    navigate(`/location/${point.id}`, { state: locationData });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {preferCertified ? (
            <>
              <Award className="h-5 w-5 text-blue-400" />
              {t("Certified Dark Sky Locations", "认证暗夜地点")}
            </>
          ) : (
            <>
              <Telescope className="h-5 w-5 text-primary" />
              {t("Recommended Photo Points", "推荐拍摄点")}
            </>
          )}
          {loading && (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              {language === 'zh' && <span className="text-sm ml-1">加载中</span>}
            </div>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {userLocation && (
            <CopyLocationButton 
              latitude={userLocation.latitude} 
              longitude={userLocation.longitude}
              name={t("Current Location", "当前位置")}
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary-focus hover:bg-cosmic-800/70 px-2 h-7 text-xs"
            />
          )}
          <Link to="/photo-points">
            <Button variant="link" size="sm" className="text-primary hover:opacity-80 transition-opacity px-2 h-7 text-xs">
              {t("View All", "查看所有")}
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {recommendedPoints.length === 0 ? (
          !hideEmptyMessage && loading && (
            <div className="text-center py-6 text-muted-foreground">
              {t("Searching for photo points...", "正在搜索拍摄点...")}
            </div>
          )
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
                <h4 className="font-medium text-sm line-clamp-1">
                  {language === 'en' ? point.name : (point.chineseName || point.name)}
                </h4>
                
                <div className="flex items-center">
                  {point.isDarkSkyReserve || point.certification ? (
                    <div className="flex items-center mr-2">
                      <Award className="h-3 w-3 text-blue-400 mr-1" fill="rgba(96, 165, 250, 0.3)" />
                    </div>
                  ) : null}
                  <div className="flex items-center">
                    <Star className="h-3 w-3 text-yellow-400 mr-1" fill="#facc15" />
                    <span className="text-xs font-medium">{formatSIQSScore(point.siqs)}</span>
                  </div>
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
                  className="h-6 text-xs px-2 text-primary hover:text-primary-focus hover:bg-cosmic-800/50 transition-all duration-300"
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

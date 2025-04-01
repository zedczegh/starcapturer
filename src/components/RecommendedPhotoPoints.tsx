
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Telescope, Loader2, Award } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots"; 
import CopyLocationButton from "@/components/location/CopyLocationButton";
import { saveLocationFromPhotoPoints } from "@/utils/locationStorage";
import { findLocationsWithinRadius } from "@/services/locationSearchService";
import { batchCalculateSiqs } from "@/services/realTimeSiqsService";
import PhotoPointCard from "./photoPoints/PhotoPointCard";

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
          
          // batchCalculateSiqs already filters out SIQS=0 locations
          let filteredPoints = pointsWithSiqs;
          
          if (preferCertified) {
            const certifiedPoints = filteredPoints.filter(p => p.isDarkSkyReserve || p.certification);
            filteredPoints = certifiedPoints.length > 0 ? certifiedPoints : filteredPoints;
          }
          
          // Sort by distance (closest first)
          filteredPoints.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
          
          // Then sort by SIQS score within similar distance ranges
          const distanceGroups: { [key: number]: SharedAstroSpot[] } = {};
          
          filteredPoints.forEach(point => {
            const distanceGroup = Math.floor((point.distance || 0) / 50);
            if (!distanceGroups[distanceGroup]) distanceGroups[distanceGroup] = [];
            distanceGroups[distanceGroup].push(point);
          });
          
          // Sort each distance group by SIQS
          Object.keys(distanceGroups).forEach(group => {
            distanceGroups[parseInt(group)].sort((a, b) => (b.siqs || 0) - (a.siqs || 0));
          });
          
          // Flatten the groups back to an array
          const sortedPoints = Object.keys(distanceGroups)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .flatMap(group => distanceGroups[parseInt(group)]);
          
          setRecommendedPoints(sortedPoints.slice(0, 5));
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
            <PhotoPointCard 
              key={point.id}
              point={point}
              onSelect={handleSelectPoint}
              onViewDetails={handleViewDetails}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default RecommendedPhotoPoints;

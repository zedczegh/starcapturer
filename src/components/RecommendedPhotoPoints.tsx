
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
import { motion } from "framer-motion";

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
        // Use appropriate search radius
        const radius = 200; // 200km is a more appropriate searching radius
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
          
          // Sort by distance first, then by SIQS
          filteredPoints.sort((a, b) => {
            // First compare by certification status
            const aIsCertified = a.isDarkSkyReserve || a.certification;
            const bIsCertified = b.isDarkSkyReserve || b.certification;
            
            if (aIsCertified && !bIsCertified) return -1;
            if (!aIsCertified && bIsCertified) return 1;
            
            // If both have the same certification status, compare by distance
            const distanceA = a.distance || Infinity;
            const distanceB = b.distance || Infinity;
            
            if (distanceA !== distanceB) {
              return distanceA - distanceB;
            }
            
            // If distances are equal, compare by SIQS
            return (b.siqs || 0) - (a.siqs || 0);
          });
          
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className={`space-y-4 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="flex items-center justify-between" variants={itemVariants}>
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
      </motion.div>
      
      <div className="grid grid-cols-1 gap-3">
        {recommendedPoints.length === 0 ? (
          !hideEmptyMessage && loading && (
            <motion.div 
              className="text-center py-6 text-muted-foreground glassmorphism-light rounded-lg"
              variants={itemVariants}
            >
              {t("Searching for photo points...", "正在搜索拍摄点...")}
            </motion.div>
          )
        ) : (
          recommendedPoints.map((point, index) => (
            <motion.div key={point.id} variants={itemVariants}>
              <PhotoPointCard 
                point={point}
                onSelect={handleSelectPoint}
                onViewDetails={handleViewDetails}
              />
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default RecommendedPhotoPoints;

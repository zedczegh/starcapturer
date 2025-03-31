
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Star, Award, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSIQSScore } from "@/utils/geoUtils";
import { SharedAstroSpot } from '@/lib/api/astroSpots';
import { useNavigate } from 'react-router-dom';
import { saveLocationFromPhotoPoints } from "@/utils/locationStorage";
import { calculateRealTimeSiqs } from "@/services/realTimeSiqsService";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
  showRealTimeSiqs?: boolean;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ location, index, showRealTimeSiqs = false }) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [isUpdatingSiqs, setIsUpdatingSiqs] = useState(false);
  
  // Update SIQS if needed
  useEffect(() => {
    if (showRealTimeSiqs && location.latitude && location.longitude && !isUpdatingSiqs) {
      // Only fetch if we don't already have a valid SIQS score
      const hasValidSiqs = typeof location.siqs === 'number' && location.siqs > 0;
      if (!hasValidSiqs) {
        const fetchRealTimeSiqs = async () => {
          try {
            setIsUpdatingSiqs(true);
            const result = await calculateRealTimeSiqs(
              location.latitude,
              location.longitude,
              location.bortleScale || 5
            );
            // No need to update state as this is handled by the parent component
            setIsUpdatingSiqs(false);
          } catch (error) {
            console.error("Error fetching real-time SIQS:", error);
            setIsUpdatingSiqs(false);
          }
        };
        
        fetchRealTimeSiqs();
      }
    }
  }, [location, showRealTimeSiqs]);
  
  // Animation variants
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        delay: index * 0.05 // Reduced delay for faster rendering
      }
    }
  };
  
  // Get certification badge color and text
  const getCertificationInfo = () => {
    if (!location.certification) return { color: "blue", text: "Certified" };
    
    const cert = location.certification.toLowerCase();
    
    if (cert.includes('sanctuary')) {
      return { 
        color: "purple", 
        text: "Sanctuary",
        tooltip: t("Dark Sky Sanctuary - An exceptionally dark and remote location", 
                  "暗夜保护区 - 特别黑暗和偏远的地点")
      };
    }
    
    if (cert.includes('reserve')) {
      return { 
        color: "blue", 
        text: "Reserve",
        tooltip: t("Dark Sky Reserve - A large area with an exceptional quality of starry nights", 
                  "暗夜保护区 - 拥有优质星空的大面积区域")
      };
    }
    
    if (cert.includes('park')) {
      return { 
        color: "green", 
        text: "Park",
        tooltip: t("Dark Sky Park - A park or public land with exceptional starry skies", 
                  "暗夜公园 - 拥有优质星空的公园或公共土地")
      };
    }
    
    if (cert.includes('community')) {
      return { 
        color: "amber", 
        text: "Community",
        tooltip: t("Dark Sky Community - A community dedicated to preserving dark skies", 
                  "暗夜社区 - 致力于保护暗夜天空的社区")
      };
    }
    
    return { 
      color: "blue", 
      text: "Certified",
      tooltip: t("Certified Dark Sky Location", "认证暗夜地点")
    };
  };
  
  const certInfo = getCertificationInfo();
  const colorClasses = {
    "blue": "bg-blue-500/30 text-blue-200 border-blue-500/30",
    "purple": "bg-purple-500/30 text-purple-200 border-purple-500/30",
    "green": "bg-green-500/30 text-green-200 border-green-500/30",
    "amber": "bg-amber-500/30 text-amber-200 border-amber-500/30"
  };
  
  const locationName = language === 'en' ? location.name : (location.chineseName || location.name);
  
  const handleViewDetails = () => {
    const locationData = {
      id: location.id,
      name: locationName,
      latitude: location.latitude,
      longitude: location.longitude,
      bortleScale: location.bortleScale,
      siqs: location.siqs, // Include current SIQS to maintain consistency
      timestamp: new Date().toISOString(),
      fromPhotoPoints: true,
      isDarkSkyReserve: location.isDarkSkyReserve,
      certification: location.certification
    };
    
    saveLocationFromPhotoPoints(locationData);
    navigate(`/location/${location.id}`, { state: locationData });
  };
  
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      className="glassmorphism rounded-xl overflow-hidden hover:border-cosmic-500/40 transition-all duration-300"
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold mb-1 pr-2">
            {locationName}
          </h3>
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 text-yellow-400" fill="#facc15" />
            <span className="font-bold">{formatSIQSScore(location.siqs)}</span>
          </div>
        </div>
        
        {(location.certification || location.isDarkSkyReserve) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs mb-3 ${colorClasses[certInfo.color as keyof typeof colorClasses]}`}>
                  <Award className="h-3 w-3 mr-1" fill="currentColor" fillOpacity={0.3} />
                  <span>{certInfo.text}</span>
                </div>
              </TooltipTrigger>
              {certInfo.tooltip && (
                <TooltipContent side="top">
                  <p>{certInfo.tooltip}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
        
        <div className="flex items-center text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">
            {location.distance ? (
              location.distance > 1 ? 
                `${Math.round(location.distance)} km` : 
                `${Math.round(location.distance * 1000)} m`
            ) : (
              t("Distance unknown", "距离未知")
            )}
          </span>
        </div>
        
        <Button 
          onClick={handleViewDetails}
          className="w-full bg-cosmic-800/80 hover:bg-cosmic-700/80 border border-cosmic-600/30 hover:border-cosmic-500/50 transition-all duration-300"
        >
          {t("View Details", "查看详情")}
        </Button>
      </div>
    </motion.div>
  );
};

export default PhotoLocationCard;


import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, NavigationIcon, Share2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SharedAstroSpot, generateBaiduMapsUrl } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { getScoreColorClass } from "@/components/siqs/utils/scoreUtils";

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  onNavigate: (e: React.MouseEvent, location: SharedAstroSpot) => void;
  onShare: (e: React.MouseEvent, location: SharedAstroSpot) => void;
  index: number;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({
  location,
  onNavigate,
  onShare,
  index
}) => {
  const { t } = useLanguage();
  
  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };
  
  // Add animation for high SIQS scores
  const scoreAnimationClass = location.siqs && location.siqs > 7 
    ? "animate-pulse" 
    : "";
  
  // Format distance for display
  const formatDistance = (distance?: number) => {
    if (distance === undefined) return t("Unknown distance", "未知距离");
    
    if (distance < 1) 
      return t(`${Math.round(distance * 1000)} m away`, `距离 ${Math.round(distance * 1000)} 米`);
    if (distance < 100) 
      return t(`${Math.round(distance)} km away`, `距离 ${Math.round(distance)} 公里`);
    return t(`${Math.round(distance / 100) * 100} km away`, `距离 ${Math.round(distance / 100) * 100} 公里`);
  };
  
  // Get score color based on SIQS
  const scoreColorClass = location.siqs ? getScoreColorClass(location.siqs) : "text-muted-foreground";

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className="h-full"
    >
      <Link 
        to={`/location/${location.id}`}
        className="glassmorphism p-4 rounded-lg hover:bg-background/50 transition-colors flex flex-col h-full"
      >
        {location.photoUrl && (
          <div className="h-48 w-full overflow-hidden rounded-md mb-4">
            <img 
              src={location.photoUrl} 
              alt={location.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex items-start justify-between mb-2">
          <h2 className="font-semibold text-lg">{location.name}</h2>
          <div className={`flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded ${scoreAnimationClass}`}>
            <Star className={`h-3.5 w-3.5 fill-current ${scoreColorClass}`} />
            <span className={`font-medium text-sm ${scoreColorClass}`}>
              {location.siqs?.toFixed(1) || "N/A"}
            </span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow">
          {location.description}
        </p>
        
        <div className="flex justify-end items-center mb-3">
          {location.distance !== undefined && (
            <div className="text-xs font-medium bg-background/30 px-2 py-1 rounded-full">
              {formatDistance(location.distance)}
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
                  onClick={(e) => onNavigate(e, location)}
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
                  onClick={(e) => onShare(e, location)}
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
    </motion.div>
  );
};

export default PhotoLocationCard;


import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Star, Telescope } from "lucide-react";
import { SharedAstroSpot } from "@/types/weather";
import { useLanguage } from "@/contexts/LanguageContext";
import { getScoreColorClass } from "@/components/siqs/utils/scoreUtils";
import { Button } from "@/components/ui/button";

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({
  location,
  index
}) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  
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
  
  // Handle navigation to location details
  const handleCardClick = () => {
    navigate(`/location/${location.id}`, {
      state: {
        id: location.id,
        name: language === 'en' ? location.name : (location.chineseName || location.name),
        latitude: location.latitude,
        longitude: location.longitude,
        bortleScale: location.bortleScale,
        timestamp: new Date().toISOString()
      }
    });
  };

  // Get the appropriate name based on language
  const displayName = language === 'en' ? 
    location.name : 
    (location.chineseName || location.name);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className="h-full"
    >
      <div 
        className="glassmorphism p-5 rounded-xl hover:bg-cosmic-800/50 transition-all duration-300 flex flex-col h-full cursor-pointer border border-cosmic-600/20 hover:border-primary/30 group"
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between mb-3">
          <h2 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">{displayName}</h2>
          <div className={`flex items-center gap-1 bg-cosmic-800/70 border border-cosmic-600/20 px-2 py-1 rounded-full ${scoreAnimationClass}`}>
            <Star className={`h-3.5 w-3.5 fill-current ${scoreColorClass}`} />
            <span className={`font-medium text-sm ${scoreColorClass}`}>
              {location.siqs?.toFixed(1) || "N/A"}
            </span>
          </div>
        </div>
        
        <div className="flex flex-1 items-center mt-1 mb-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {t("Bortle Scale", "波特尔尺度")}: {location.bortleScale || "N/A"}
          </p>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-cosmic-600/10">
          <div className="flex items-center">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
            <span className="text-xs text-muted-foreground">
              {formatDistance(location.distance)}
            </span>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2 text-primary hover:text-primary-focus hover:bg-cosmic-800/70"
          >
            <Telescope className="h-3 w-3 mr-1" />
            {t("View", "查看")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default PhotoLocationCard;

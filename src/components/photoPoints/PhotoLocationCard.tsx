
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { getScoreColorClass } from "@/components/siqs/utils/scoreUtils";

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({
  location,
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
        <div className="flex items-start justify-between mb-2">
          <h2 className="font-semibold text-lg">{location.name}</h2>
          <div className={`flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded ${scoreAnimationClass}`}>
            <Star className={`h-3.5 w-3.5 fill-current ${scoreColorClass}`} />
            <span className={`font-medium text-sm ${scoreColorClass}`}>
              {location.siqs?.toFixed(1) || "N/A"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center mt-auto pt-3">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
          <span className="text-xs text-muted-foreground">
            {formatDistance(location.distance)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

export default PhotoLocationCard;

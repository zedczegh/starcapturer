
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { getScoreColorClass } from "@/components/siqs/utils/scoreUtils";
import { formatLocationDistance } from "@/utils/unitConversion";

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
        onClick={handleCardClick}
        className="glassmorphism p-4 rounded-lg hover:bg-background/50 hover:scale-102 transition-all duration-300 flex flex-col h-full cursor-pointer"
      >
        <div className="flex items-start justify-between mb-2">
          <h2 className="font-semibold text-lg">{displayName}</h2>
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
            {formatLocationDistance(location.distance, language)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PhotoLocationCard;

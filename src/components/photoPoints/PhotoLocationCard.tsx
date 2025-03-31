
import React, { memo } from "react";
import { motion } from "framer-motion";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, ExternalLink, Star, Award, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { saveLocationFromPhotoPoints } from "@/utils/locationStorage";
import { formatSIQSScore } from "@/utils/geoUtils";

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
  showRealTimeSiqs?: boolean;
}

// Enhanced card component for photo location display
const PhotoLocationCard: React.FC<PhotoLocationCardProps> = memo(({ location, index, showRealTimeSiqs = false }) => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  
  const locationName = language === 'en' ? location.name : (location.chineseName || location.name);
  
  // Format distance with appropriate units
  const formatDistance = (distance?: number) => {
    if (distance === undefined || distance === null) return t("Unknown distance", "未知距离");
    
    if (distance < 1) {
      return t(`${Math.round(distance * 1000)} m away`, `距离 ${Math.round(distance * 1000)} 米`);
    }
    
    if (distance < 100) {
      return t(`${distance.toFixed(1)} km away`, `距离 ${distance.toFixed(1)} 公里`);
    }
    
    return t(`${Math.round(distance)} km away`, `距离 ${Math.round(distance)} 公里`);
  };
  
  // Handle view details click
  const handleViewDetails = () => {
    // Prepare location data for storage and navigation
    const locationData = {
      id: location.id,
      name: locationName,
      latitude: location.latitude,
      longitude: location.longitude,
      bortleScale: location.bortleScale,
      timestamp: new Date().toISOString(),
      fromPhotoPoints: true,
      isDarkSkyReserve: location.isDarkSkyReserve,
      certification: location.certification
    };
    
    // Save location data to storage
    saveLocationFromPhotoPoints(locationData);
    
    // Navigate to location detail page
    navigate(`/location/${location.id}`, { state: locationData });
  };
  
  // Get certification badge for the location
  const getCertificationBadge = () => {
    if (!location.certification && !location.isDarkSkyReserve) return null;
    
    let badgeText = "";
    let badgeClass = "bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 border-blue-500/30";
    
    if (location.isDarkSkyReserve) {
      badgeText = t("Dark Sky Reserve", "暗夜保护区");
      badgeClass = "bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-200 border-indigo-500/30";
    } else if (location.certification) {
      // Show specific certification type
      const certType = location.certification.toLowerCase();
      
      if (certType.includes("sanctuary")) {
        badgeText = t("Dark Sky Sanctuary", "暗夜保护区");
        badgeClass = "bg-purple-500/30 hover:bg-purple-500/40 text-purple-200 border-purple-500/30";
      } else if (certType.includes("park")) {
        badgeText = t("Dark Sky Park", "暗夜公园");
        badgeClass = "bg-green-500/30 hover:bg-green-500/40 text-green-200 border-green-500/30";
      } else if (certType.includes("community")) {
        badgeText = t("Dark Sky Community", "暗夜社区");
        badgeClass = "bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 border-blue-500/30";
      } else if (certType.includes("urban")) {
        badgeText = t("Urban Night Sky", "城市夜空");
        badgeClass = "bg-cyan-500/30 hover:bg-cyan-500/40 text-cyan-200 border-cyan-500/30";
      } else {
        badgeText = t("Certified", "已认证");
      }
    }
    
    return badgeText ? (
      <Badge variant="outline" className={`text-xs font-normal px-2 py-0 h-5 ${badgeClass}`}>
        {badgeText}
      </Badge>
    ) : null;
  };
  
  // Animate variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        delay: index * 0.05, // Stagger effect
        ease: "easeOut"
      }
    }
  };
  
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="glassmorphism rounded-lg overflow-hidden transition-all duration-300 hover:bg-cosmic-800/40 hover:translate-y-[-2px]"
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="mr-2">
            <h3 className="font-semibold text-lg mb-1">{locationName}</h3>
            <div className="flex items-center gap-2 mb-2">
              {getCertificationBadge()}
              {location.siqs !== undefined && (
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" fill="#facc15" />
                  <span className="text-sm font-medium">{formatSIQSScore(location.siqs)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              <span>{formatDistance(location.distance)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <Button
            size="sm"
            variant="outline"
            className="text-xs bg-cosmic-800/40 hover:bg-cosmic-700/60 border-cosmic-700/30"
            onClick={() => {
              // Open in Google Maps
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`,
                '_blank'
              );
            }}
          >
            <Navigation className="h-3.5 w-3.5 mr-1.5" />
            {t("Directions", "导航")}
          </Button>
          
          <Button
            size="sm"
            variant="default"
            className="text-xs"
            onClick={handleViewDetails}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            {t("View Details", "查看详情")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

export default PhotoLocationCard;


import React from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Award } from "lucide-react";
import { calculateDistance } from "@/utils/geoUtils";
import { formatDistanceDisplay } from "@/utils/formatters";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import SiqsScoreBadge from "./cards/SiqsScoreBadge";

interface PhotoPointCardProps {
  point: SharedAstroSpot;
  onSelect?: (point: SharedAstroSpot) => void;
  onViewDetails?: () => void;
  userLocation?: { latitude: number; longitude: number } | null;
  compact?: boolean;
  realTimeScore?: boolean;
}

const PhotoPointCard: React.FC<PhotoPointCardProps> = ({
  point,
  onSelect,
  onViewDetails,
  userLocation,
  compact = false,
  realTimeScore = false,
}) => {
  const { t, language } = useLanguage();
  
  // Use the point's distance if available, otherwise calculate it
  const distance = point.distance || 
    (userLocation 
      ? calculateDistance(userLocation.latitude, userLocation.longitude, point.latitude, point.longitude) 
      : null);
  
  // Determine if this is a certified location
  const isCertified = Boolean(point.isDarkSkyReserve || point.certification);
  
  // Display name based on language and availability
  const displayName = language === "zh" && point.chineseName 
    ? point.chineseName 
    : point.name;
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`overflow-hidden border border-cosmic-800 bg-cosmic-900/70 hover:bg-cosmic-900 transition-colors ${compact ? 'shadow-sm' : 'shadow-md'}`}>
        <CardContent className={compact ? "p-2.5" : "p-3"}>
          <div className="flex justify-between">
            <div className="flex-1 mr-3">
              {/* Location name */}
              <h3 className={`font-medium text-cosmic-50 ${compact ? 'text-sm line-clamp-1' : 'text-base line-clamp-2'}`}>
                {displayName}
              </h3>
              
              {/* Distance */}
              {distance !== null && (
                <p className={`text-muted-foreground mt-0.5 ${compact ? 'text-2xs' : 'text-xs'}`}>
                  {formatDistanceDisplay(distance)}
                </p>
              )}
              
              {/* Certification badge */}
              {isCertified && (
                <div className="flex items-center gap-1 mt-1">
                  <Award className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-500`} />
                  <span className={`${compact ? 'text-2xs' : 'text-xs'} text-amber-300`}>
                    {t("Certified Dark Sky", "官方认证暗夜天空")}
                  </span>
                </div>
              )}
            </div>
            
            {/* SIQS score */}
            <div className="flex flex-col items-end gap-2">
              <SiqsScoreBadge 
                score={point.siqs || 0} 
                compact={compact}
                realTime={realTimeScore}
              />
              
              {!compact && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 py-0 h-7 text-xs text-primary"
                  onClick={() => {
                    if (onSelect) onSelect(point);
                    if (onViewDetails) onViewDetails();
                  }}
                >
                  {t("View Details", "查看详情")}
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PhotoPointCard;

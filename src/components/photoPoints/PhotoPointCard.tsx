
import React from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { MapPin, Star } from "lucide-react";

interface PhotoPointCardProps {
  point: SharedAstroSpot;
  onSelect?: (point: SharedAstroSpot) => void;
  onViewDetails: (point: SharedAstroSpot) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const PhotoPointCard: React.FC<PhotoPointCardProps> = ({ 
  point, 
  onSelect,
  onViewDetails,
  userLocation
}) => {
  const { language, t } = useLanguage();

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails(point);
  };

  const formatDistance = (distance?: number) => {
    if (distance === undefined) return t("Unknown distance", "未知距离");
    
    if (distance < 1) 
      return t(`${Math.round(distance * 1000)} m away`, `距离 ${Math.round(distance * 1000)} 米`);
    if (distance < 100) 
      return t(`${Math.round(distance)} km away`, `距离 ${Math.round(distance)} 公里`);
    return t(`${Math.round(distance / 100) * 100} km away`, `距离 ${Math.round(distance / 100) * 100} 公里`);
  };

  const pointName = language === 'en' ? point.name : (point.chineseName || point.name);
  
  // Format SIQS score to handle both number and object types
  const siqsScore = typeof point.siqs === 'object' && point.siqs ? 
    point.siqs.score : (point.siqs || 0);
  
  const formattedSiqs = siqsScore.toFixed(1);

  return (
    <div 
      className="glassmorphism p-3 rounded-lg cursor-pointer hover:bg-background/50 transition-colors"
      onClick={() => onSelect?.(point)}
    >
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="font-medium text-sm line-clamp-1">
          {pointName}
        </h4>
        
        <div className="flex items-center bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/40">
          <Star className="h-3.5 w-3.5 text-yellow-400 mr-1" fill="#facc15" />
          <span className="text-xs font-medium">{formattedSiqs}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
          <span className="text-sm text-muted-foreground font-medium">
            {formatDistance(point.distance)}
          </span>
        </div>
      </div>
      
      <div className="mt-3 flex justify-end">
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-7 text-sm px-2.5 bg-gradient-to-r from-blue-500/20 to-green-500/20 hover:from-blue-500/30 hover:to-green-500/30 text-primary/90 hover:text-primary"
          onClick={handleViewDetails}
        >
          {t("View", "查看")}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(PhotoPointCard);

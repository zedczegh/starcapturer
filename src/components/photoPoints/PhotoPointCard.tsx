
import React from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Star, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSiqsScore, formatSiqsForDisplay } from "@/utils/siqsHelpers";
import { getCertificationInfo, getLocalizedCertText } from "./cards/CertificationBadge";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDisplayName } from "./cards/DisplayNameResolver";
import CardActions from "./cards/components/CardActions";
import LocationHeaderMainDisplay from "./cards/LocationHeaderMainDisplay";

interface PhotoPointCardProps {
  point: SharedAstroSpot;
  onSelect?: (point: SharedAstroSpot) => void;
  onViewDetails: (e: React.MouseEvent) => void;
  userLocation: { latitude: number; longitude: number } | null;
}

const PhotoPointCard: React.FC<PhotoPointCardProps> = ({
  point,
  onSelect,
  onViewDetails,
  userLocation
}) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const certInfo = React.useMemo(() => getCertificationInfo(point), [point]);
  
  const { displayName } = useDisplayName({
    location: point,
    language,
    locationCounter: null
  });

  // SWAP: displayName should be the main title, smallName is geocoded
  const mainName = displayName || t("Unnamed Location", "未命名位置");
  const smallName = (language === "zh" ? point.name : point.chineseName) || "";
  const showSmallName = smallName && smallName !== mainName;

  const formatCardDistance = (distance?: number) => {
    if (distance === undefined) return t("Unknown distance", "未知距离");
    
    if (distance < 1) 
      return t(`${Math.round(distance * 1000)} m`, `${Math.round(distance * 1000)} 米`);
    if (distance < 100) 
      return t(`${Math.round(distance)} km`, `${Math.round(distance)} 公里`);
    return t(`${Math.round(distance / 100) * 100} km`, `${Math.round(distance / 100) * 100} 公里`);
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(point);
    }
  };
  
  // Get proper SIQS score
  const siqsScore = getSiqsScore(point.siqs);
  const formattedSiqs = formatSiqsForDisplay(siqsScore);

  return (
    <div
      className="glassmorphism p-3 rounded-lg cursor-pointer hover:bg-background/50 transition-colors"
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between mb-1.5">
        <LocationHeaderMainDisplay
          mainName={mainName}
          originalName={smallName}
          showOriginalName={showSmallName}
        />
        <div className="flex items-center bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/40">
          <Star className="h-3.5 w-3.5 text-yellow-400 mr-1" fill="#facc15" />
          <span className="text-xs font-medium">{formattedSiqs}</span>
        </div>
      </div>
      
      {certInfo && (
        <div className="flex items-center mt-1.5 mb-2">
          <Badge variant="outline" className={`${certInfo.color} px-2 py-0.5 rounded-full flex items-center`}>
            {React.createElement(certInfo.icon, { className: "h-4 w-4 mr-1.5" })}
            <span className="text-xs">{getLocalizedCertText(certInfo, language)}</span>
          </Badge>
        </div>
      )}
      
      {point.latitude && point.longitude && (
        <div className="mt-1.5 mb-2 flex items-center">
          <Navigation className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          <span className="text-xs text-muted-foreground">
            {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
          </span>
        </div>
      )}
      
      {userLocation && point.latitude && point.longitude && (
        <div className="mt-1.5 mb-2 flex items-center">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          <span className="text-xs text-muted-foreground">
            {formatCardDistance(point.distance)}
          </span>
        </div>
      )}
      
      <CardActions onViewDetails={onViewDetails} />
    </div>
  );
};

export default PhotoPointCard;

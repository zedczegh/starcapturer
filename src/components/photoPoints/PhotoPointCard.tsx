
import React, { useState, useEffect, useMemo } from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSIQSScore } from "@/utils/geoUtils";
import { getCertificationInfo, getLocalizedCertText } from "./utils/certificationUtils";
import { useNavigate } from "react-router-dom";
import LightPollutionIndicator from "@/components/location/LightPollutionIndicator";
import { useIsMobile } from "@/hooks/use-mobile";
import { findNearestTown } from "@/utils/nearestTownCalculator";

interface PhotoPointCardProps {
  point: SharedAstroSpot;
  onSelect?: (point: SharedAstroSpot) => void;
  onViewDetails: (point: SharedAstroSpot) => void;
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
  const certInfo = useMemo(() => getCertificationInfo(point), [point]);
  
  // Get nearest town information directly from our database with enhanced details
  const nearestTownInfo = point.latitude && point.longitude ? 
    findNearestTown(point.latitude, point.longitude, language) : null;
  
  const formatDistance = (distance?: number) => {
    if (distance === undefined) return t("Unknown distance", "未知距离");
    
    if (distance < 1) 
      return t(`${Math.round(distance * 1000)} m away`, `距离 ${Math.round(distance * 1000)} 米`);
    if (distance < 100) 
      return t(`${Math.round(distance)} km away`, `距离 ${Math.round(distance)} 公里`);
    return t(`${Math.round(distance / 100) * 100} km away`, `距离 ${Math.round(distance / 100) * 100} 公里`);
  };

  const getLocationId = () => {
    if (!point || !point.latitude || !point.longitude) return null;
    return `loc-${point.latitude.toFixed(6)}-${point.longitude.toFixed(6)}`;
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!point || !point.latitude || !point.longitude) return;
    
    const locationId = getLocationId();
    if (!locationId) return;
    
    navigate(`/location/${locationId}`, {
      state: {
        id: locationId,
        name: point.name,
        chineseName: point.chineseName,
        latitude: point.latitude,
        longitude: point.longitude,
        bortleScale: point.bortleScale || 4,
        siqsResult: {
          score: point.siqs || 0
        },
        certification: point.certification,
        isDarkSkyReserve: point.isDarkSkyReserve,
        timestamp: new Date().toISOString(),
        fromPhotoPoints: true
      }
    });
  };

  // Use the detailed location name as the display name
  const pointName = nearestTownInfo?.detailedName || 
    (language === 'en' ? point.name : (point.chineseName || point.name));

  // Check if we're using our database location name vs. original name
  const showOriginalName = nearestTownInfo && 
    nearestTownInfo.townName !== (language === 'en' ? 'Remote area' : '偏远地区') && 
    point.name && 
    !point.name.includes(nearestTownInfo.townName);

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
          <span className="text-xs font-medium">{formatSIQSScore(point.siqs)}</span>
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
      
      {/* Show original location name if we're using nearest town as main title and they differ */}
      {showOriginalName && (
        <div className="mt-1.5 mb-2 flex items-center">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          <span className="text-xs text-muted-foreground line-clamp-1">
            {language === 'en' ? point.name : (point.chineseName || point.name)}
          </span>
        </div>
      )}
      
      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
          <span className="text-sm text-muted-foreground font-medium">
            {formatDistance(point.distance)}
          </span>
        </div>
        
        <div className="flex items-center">
          <LightPollutionIndicator 
            bortleScale={point.bortleScale || 4} 
            size="sm" 
            showBortleNumber={true}
            className="text-xs"
          />
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


import React, { useState, useEffect, useMemo } from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Star, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSiqsScore } from "@/utils/siqsHelpers";
import { getCertificationInfo, getLocalizedCertText } from "./cards/CertificationBadge";
import { useNavigate } from "react-router-dom";
import LightPollutionIndicator from "@/components/location/LightPollutionIndicator";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDisplayName } from "./cards/DisplayNameResolver";
import { findNearestTown } from "@/utils/nearestTownCalculator";
import { formatDistance } from "@/utils/location/formatDistance";

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
  
  const { displayName, showOriginalName } = useDisplayName({
    location: point,
    language,
    locationCounter: null
  });
  
  const nearestTownInfo = useMemo(() => 
    point.latitude && point.longitude ? 
      findNearestTown(point.latitude, point.longitude, language) : 
      null
  , [point.latitude, point.longitude, language]);
  
  const formatCardDistance = (distance?: number) => {
    if (distance === undefined) return t("Unknown distance", "未知距离");
    
    if (distance < 1) 
      return t(`${Math.round(distance * 1000)} m`, `${Math.round(distance * 1000)} 米`);
    if (distance < 100) 
      return t(`${Math.round(distance)} km`, `${Math.round(distance)} 公里`);
    return t(`${Math.round(distance / 100) * 100} km`, `${Math.round(distance / 100) * 100} 公里`);
  };

  const getLocationId = () => {
    if (!point || !point.latitude || !point.longitude) return null;
    return point.id || `loc-${point.latitude.toFixed(6)}-${point.longitude.toFixed(6)}`;
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!point || !point.latitude || !point.longitude) return;
    
    const locationId = getLocationId();
    if (!locationId) return;
    
    // Ensure Chinese name is properly included in the navigation state
    navigate(`/location/${locationId}`, {
      state: {
        id: locationId,
        name: point.name || '',
        chineseName: point.chineseName || '',
        latitude: point.latitude,
        longitude: point.longitude,
        bortleScale: point.bortleScale || 4,
        siqsResult: {
          score: point.siqs || 0
        },
        certification: point.certification || '',
        isDarkSkyReserve: !!point.isDarkSkyReserve,
        timestamp: new Date().toISOString(),
        fromPhotoPoints: true
      }
    });
  };

  return (
    <div 
      className="glassmorphism p-3 rounded-lg cursor-pointer hover:bg-background/50 transition-colors"
      onClick={() => onSelect?.(point)}
    >
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="font-medium text-sm line-clamp-1">
          {displayName || (language === 'zh' && point.chineseName ? point.chineseName : point.name)}
        </h4>
        
        <div className="flex items-center bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/40">
          <Star className="h-3.5 w-3.5 text-yellow-400 mr-1" fill="#facc15" />
          <span className="text-xs font-medium">{formatSiqsScore(point.siqs)}</span>
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
      
      {showOriginalName && (
        <div className="mt-1.5 mb-2 flex items-center">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          <span className="text-xs text-muted-foreground line-clamp-1">
            {language === 'zh' ? (point.name || '') : (point.chineseName || point.name || '')}
          </span>
        </div>
      )}
      
      {nearestTownInfo && nearestTownInfo.detailedName && (
        <div className="mt-1.5 mb-2 flex items-center">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          <span className="text-xs text-muted-foreground line-clamp-1">
            {nearestTownInfo.detailedName}
          </span>
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
      
      <div className="mt-3 flex justify-end">
        <Button 
          variant="ghost"
          size="sm"
          onClick={handleViewDetails}
          className="text-primary hover:text-primary-focus hover:bg-cosmic-800/50 transition-all duration-300 text-sm"
        >
          {t("View Details", "查看详情")}
        </Button>
      </div>
    </div>
  );
};

export default PhotoPointCard;

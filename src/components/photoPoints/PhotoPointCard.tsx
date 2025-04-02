
import React, { useState, useEffect } from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Star, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSIQSScore } from "@/utils/geoUtils";
import { getLocationNameForCoordinates } from "@/components/location/map/LocationNameService";
import { extractNearestTownName, getRegionalName } from "@/utils/locationNameFormatter";
import { getCertificationInfo, getLocalizedCertText } from "./utils/certificationUtils";
import { useNavigate } from "react-router-dom";

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
  const [nearestTown, setNearestTown] = useState<string | null>(null);
  const [loadingTown, setLoadingTown] = useState(false);

  useEffect(() => {
    if (point.latitude && point.longitude) {
      const fetchNearestTown = async () => {
        setLoadingTown(true);
        try {
          // First check if we already have a name from point data
          if (point.name && 
              !point.name.includes("°") && 
              !point.name.includes("Location at") &&
              !point.name.includes("位置在") &&
              !point.name.includes("Remote area") &&
              !point.name.includes("偏远地区")) {
            
            const extractedName = extractNearestTownName(point.name, point.description, language);
            setNearestTown(extractedName);
            setLoadingTown(false);
            return;
          }
          
          // Try directional region naming first (e.g., "Northwest Yunnan")
          const regionalName = getRegionalName(point.latitude, point.longitude, language);
          
          // If we got a valid region name, use it
          if (regionalName && regionalName !== (language === 'en' ? 'Remote area' : '偏远地区')) {
            setNearestTown(regionalName);
            setLoadingTown(false);
            return;
          }
          
          // Use enhanced location service as a fallback
          const townName = await getLocationNameForCoordinates(
            point.latitude,
            point.longitude,
            language
          );
          
          if (townName) {
            const extractedTownName = extractNearestTownName(townName, point.description, language);
            setNearestTown(extractedTownName);
          } else {
            // Better fallback for remote areas
            setNearestTown(language === 'en' ? 'Remote area' : '偏远地区');
          }
        } catch (error) {
          console.error("Error fetching nearest town:", error);
          setNearestTown(language === 'en' ? 'Remote area' : '偏远地区');
        } finally {
          setLoadingTown(false);
        }
      };
      
      fetchNearestTown();
    }
  }, [point.latitude, point.longitude, point.description, point.name, language]);

  const formatDistance = (distance?: number) => {
    if (distance === undefined) return t("Unknown distance", "未知距离");
    
    if (distance < 1) 
      return t(`${Math.round(distance * 1000)} m away`, `距离 ${Math.round(distance * 1000)} 米`);
    if (distance < 100) 
      return t(`${Math.round(distance)} km away`, `距离 ${Math.round(distance)} 公里`);
    return t(`${Math.round(distance / 100) * 100} km away`, `距离 ${Math.round(distance / 100) * 100} 公里`);
  };

  // Create a stable location ID for navigation
  const getLocationId = () => {
    if (!point || !point.latitude || !point.longitude) return null;
    return `loc-${point.latitude.toFixed(6)}-${point.longitude.toFixed(6)}`;
  };

  // Handle view details click with proper navigation
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!point || !point.latitude || !point.longitude) return;
    
    const locationId = getLocationId();
    if (!locationId) return;
    
    // Navigate programmatically to ensure proper state passing
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
        fromPhotoPoints: true // Add flag to indicate source
      }
    });
  };

  // Get certification info using our utility function
  const certInfo = getCertificationInfo(point);
  const pointName = language === 'en' ? point.name : (point.chineseName || point.name);

  return (
    <div 
      className="glassmorphism p-3 rounded-lg cursor-pointer hover:bg-background/50 transition-colors"
      onClick={() => onSelect?.(point)}
    >
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="font-medium text-sm line-clamp-1">
          {pointName}
        </h4>
        
        {/* SIQS Score - Now with improved styling */}
        <div className="flex items-center bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/40">
          <Star className="h-3.5 w-3.5 text-yellow-400 mr-1" fill="#facc15" />
          <span className="text-xs font-medium">{formatSIQSScore(point.siqs)}</span>
        </div>
      </div>
      
      {/* Certification Badge - Using our utility function */}
      {certInfo && (
        <div className="flex items-center mt-1.5 mb-2">
          <Badge variant="outline" className={`${certInfo.color} px-2 py-0.5 rounded-full flex items-center`}>
            {React.createElement(certInfo.icon, { className: "h-4 w-4 mr-1.5" })}
            <span className="text-xs">{getLocalizedCertText(certInfo, language)}</span>
          </Badge>
        </div>
      )}
      
      <div className="flex flex-col space-y-2 mt-2">
        <div className="flex items-center">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
          <span className="text-sm text-muted-foreground font-medium">
            {formatDistance(point.distance)}
          </span>
        </div>
        
        <div className="flex items-center">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
          <span className="text-sm text-muted-foreground line-clamp-1 font-medium">
            {loadingTown ? (
              <span className="text-muted-foreground/70">
                {language === 'zh' ? "加载中..." : "Loading..."}
              </span>
            ) : nearestTown ? (
              <>{t("Near ", "靠近 ")}{nearestTown}</>
            ) : (
              t("Remote area", "偏远地区")
            )}
          </span>
        </div>
      </div>
      
      <div className="mt-3 flex justify-end">
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-7 text-sm px-2.5 text-primary hover:text-primary-focus hover:bg-cosmic-800/50 transition-all duration-300"
          onClick={handleViewDetails}
        >
          {t("View", "查看")}
        </Button>
      </div>
    </div>
  );
};

export default PhotoPointCard;

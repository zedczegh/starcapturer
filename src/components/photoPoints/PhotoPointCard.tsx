
import React, { useState, useEffect } from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Star, Award, Building2, Loader2, Trees, Globe, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSIQSScore } from "@/utils/geoUtils";
import { getLocationNameForCoordinates } from "@/components/location/map/LocationNameService";
import { extractNearestTownName, getRegionalName } from "@/utils/locationNameFormatter";

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

  // Determine certification icon and color
  const getCertificationInfo = () => {
    if (!point.certification && !point.isDarkSkyReserve) {
      return null;
    }
    
    const certification = (point.certification || '').toLowerCase();
    
    if (certification.includes('sanctuary') || certification.includes('reserve')) {
      return {
        icon: <Globe className="h-4 w-4 text-blue-400 mr-1.5" />,
        text: t('Dark Sky Reserve', '暗夜保护区'),
        color: 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      };
    } else if (certification.includes('park')) {
      return {
        icon: <Trees className="h-4 w-4 text-green-400 mr-1.5" />,
        text: t('Dark Sky Park', '暗夜公园'),
        color: 'text-green-400 bg-green-400/10 border-green-400/30'
      };
    } else if (certification.includes('community')) {
      return {
        icon: <Building2 className="h-4 w-4 text-amber-400 mr-1.5" />,
        text: t('Dark Sky Community', '暗夜社区'),
        color: 'text-amber-400 bg-amber-400/10 border-amber-400/30'
      };
    } else if (certification.includes('urban')) {
      return {
        icon: <Building2 className="h-4 w-4 text-purple-400 mr-1.5" />,
        text: t('Urban Night Sky', '城市夜空'),
        color: 'text-purple-400 bg-purple-400/10 border-purple-400/30'
      };
    } else {
      return {
        icon: <ShieldCheck className="h-4 w-4 text-blue-300 mr-1.5" />,
        text: t('Certified Location', '认证地点'),
        color: 'text-blue-300 bg-blue-300/10 border-blue-300/30'
      };
    }
  };

  const pointName = language === 'en' ? point.name : (point.chineseName || point.name);
  const certInfo = getCertificationInfo();

  return (
    <div 
      className="glassmorphism p-3 rounded-lg cursor-pointer hover:bg-background/50 transition-colors"
      onClick={() => onSelect?.(point)}
    >
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="font-medium text-sm line-clamp-1">
          {pointName}
        </h4>
        
        {/* SIQS Score - Now isolated at the top right */}
        <div className="flex items-center bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full border border-yellow-500/40">
          <Star className="h-3.5 w-3.5 text-yellow-400 mr-1" fill="#facc15" />
          <span className="text-xs font-medium">{formatSIQSScore(point.siqs)}</span>
        </div>
      </div>
      
      {/* Certification Badge - Now BELOW the SIQS score */}
      {certInfo && (
        <div className={`flex items-center mt-1.5 mb-2`}>
          <Badge variant="outline" className={`${certInfo.color} px-2 py-0.5 rounded-full flex items-center`}>
            {certInfo.icon}
            <span className="text-xs">{certInfo.text}</span>
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
              <span className="flex items-center">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
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
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(point);
          }}
        >
          {t("View", "查看")}
        </Button>
      </div>
    </div>
  );
};

export default PhotoPointCard;

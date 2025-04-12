import React, { useState, useEffect, useMemo } from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatSIQSScore } from "@/utils/geoUtils";
import { getLocationNameForCoordinates } from "@/components/location/map/LocationNameService";
import { extractNearestTownName, getRegionalName } from "@/utils/locationNameFormatter";
import { getCertificationInfo, getLocalizedCertText } from "./utils/certificationUtils";
import { useNavigate } from "react-router-dom";
import LightPollutionIndicator from "@/components/location/LightPollutionIndicator";
import { useIsMobile } from "@/hooks/use-mobile";
import { calculateRealTimeSiqs } from "@/services/realTimeSiqsService";

interface PhotoPointCardProps {
  point: SharedAstroSpot;
  onSelect?: (point: SharedAstroSpot) => void;
  onViewDetails: (point: SharedAstroSpot) => void;
  userLocation: { latitude: number; longitude: number } | null;
  showRealTimeSiqs?: boolean;
}

const PhotoPointCard: React.FC<PhotoPointCardProps> = ({ 
  point, 
  onSelect,
  onViewDetails,
  userLocation,
  showRealTimeSiqs = false
}) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [nearestTown, setNearestTown] = useState<string | null>(null);
  const [loadingTown, setLoadingTown] = useState(false);
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [loadingSiqs, setLoadingSiqs] = useState(false);

  const certInfo = useMemo(() => getCertificationInfo(point), [point]);
  
  useEffect(() => {
    if (showRealTimeSiqs && point.latitude && point.longitude) {
      const fetchRealTimeSiqs = async () => {
        setLoadingSiqs(true);
        try {
          const result = await calculateRealTimeSiqs(
            point.latitude,
            point.longitude,
            point.bortleScale || 5
          );
          setRealTimeSiqs(result.siqs);
        } catch (error) {
          console.error("Error fetching real-time SIQS:", error);
        } finally {
          setLoadingSiqs(false);
        }
      };
      
      fetchRealTimeSiqs();
    }
  }, [point.latitude, point.longitude, point.bortleScale, showRealTimeSiqs]);
  
  useEffect(() => {
    if (point.latitude && point.longitude) {
      const fetchNearestTown = async () => {
        setLoadingTown(true);
        try {
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
          
          const regionalName = getRegionalName(point.latitude, point.longitude, language);
          
          if (regionalName && regionalName !== (language === 'en' ? 'Remote area' : '偏远地区')) {
            setNearestTown(regionalName);
            setLoadingTown(false);
            return;
          }
          
          const townName = await getLocationNameForCoordinates(
            point.latitude,
            point.longitude,
            language
          );
          
          if (townName) {
            const extractedTownName = extractNearestTownName(townName, point.description, language);
            setNearestTown(extractedTownName);
          } else {
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
    
    return t(`${Math.round(distance)} km away`, `距离 ${Math.round(distance)} 公里`);
  };

  const displaySiqs = realTimeSiqs !== null ? realTimeSiqs : point.siqs;
  
  const handleSelectPoint = () => {
    if (onSelect) {
      if (realTimeSiqs !== null) {
        onSelect({
          ...point,
          siqs: realTimeSiqs
        });
      } else {
        onSelect(point);
      }
    }
  };
  
  const handleViewDetails = () => {
    if (realTimeSiqs !== null) {
      onViewDetails({
        ...point,
        siqs: realTimeSiqs
      });
    } else {
      onViewDetails(point);
    }
  };

  return (
    <div className="glassmorphism p-3 rounded-lg hover:bg-cosmic-800/30 transition-colors duration-300 border border-cosmic-600/30">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          {certInfo && certInfo.icon ? (
            <div className="mr-2">
              <certInfo.icon className="w-5 h-5 text-indigo-300" />
            </div>
          ) : null}
          <div>
            <h3 className="text-sm font-medium line-clamp-1">
              {nearestTown || point.name || t("Unknown location", "未知位置")}
            </h3>
            {displaySiqs !== undefined && (
              <div className="flex items-center text-xs text-primary">
                <Star className="h-3 w-3 mr-1 fill-primary" />
                <span className="font-medium">
                  {formatSIQSScore(displaySiqs, 1)}
                  {loadingSiqs ? ' (loading...)' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end">
          {point.distance !== undefined && (
            <span className="text-xs text-muted-foreground">
              {formatDistance(point.distance)}
            </span>
          )}
          {certInfo && (
            <Badge variant="outline" className="mt-1 text-xs py-0 px-1.5 h-4">
              {getLocalizedCertText(certInfo.type, language)}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <LightPollutionIndicator 
          bortleScale={point.bortleScale || 5} 
          className="text-xs" 
          showBortleNumber={false}
          size="sm"
        />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewDetails}
          className="text-primary hover:text-primary-focus hover:bg-cosmic-800/50 sci-fi-btn transition-all duration-300 text-xs h-7"
        >
          {t("View", "查看")}
        </Button>
      </div>
    </div>
  );
};

export default PhotoPointCard;

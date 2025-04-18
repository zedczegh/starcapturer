import React, { useState } from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCertificationInfo, getLocalizedCertText } from "./cards/CertificationBadge";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDisplayName } from "./cards/DisplayNameResolver";
import { findNearestTown } from "@/utils/nearestTownCalculator";
import SiqsScoreBadge from './cards/SiqsScoreBadge';
import LightPollutionIndicator from '@/components/location/LightPollutionIndicator';
import LocationMetadata from './cards/LocationMetadata';
import VisibilityObserver from './cards/VisibilityObserver';
import RealTimeSiqsFetcher from './cards/RealTimeSiqsFetcher';
import LocationHeader from './cards/LocationHeader';
import { getSiqsScore } from '@/utils/siqsHelpers';

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
  showRealTimeSiqs?: boolean;
  isMobile?: boolean;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ 
  point, 
  onSelect,
  onViewDetails,
  userLocation
}) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const certInfo = React.useMemo(() => getCertificationInfo(point), [point]);
  
  const { displayName, showOriginalName } = useDisplayName({
    location: point,
    language,
    locationCounter: null
  });
  
  const nearestTownInfo = React.useMemo(() => 
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

  // Determine the name to display based on language preference
  const primaryName = language === 'zh' && point.chineseName ? point.chineseName : (point.name || t("Unnamed Location", "未命名位置"));
  const secondaryName = language === 'zh' ? (point.name || "") : (point.chineseName || "");
  
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [loadingSiqs, setLoadingSiqs] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const [locationCounter] = useState(() => {
    if (!point.id && !point.certification && !point.isDarkSkyReserve) {
      const storedCounter = parseInt(localStorage.getItem('potentialDarkSiteCounter') || '0');
      const newCounter = storedCounter + 1;
      localStorage.setItem('potentialDarkSiteCounter', newCounter.toString());
      return newCounter;
    }
    return null;
  });
  
  const handleSiqsCalculated = (siqs: number | null, loading: boolean) => {
    setRealTimeSiqs(siqs);
    setLoadingSiqs(loading);
  };
  
  if (realTimeSiqs === 0) {
    return null;
  }
  
  const displaySiqs = realTimeSiqs !== null ? realTimeSiqs : getSiqsScore(point.siqs);
  
  if (displaySiqs === 0 && !loadingSiqs) {
    return null;
  }
  
  const cardVariants = {
    hidden: { opacity: 0, y: isMobile ? 10 : 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: isMobile ? 0.2 : 0.4,
        delay: isMobile ? Math.min(index * 0.05, 0.3) : Math.min(index * 0.1, 0.5)
      }
    }
  };
  
  return (
    <VisibilityObserver onVisibilityChange={setIsVisible}>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        className={`glassmorphism p-4 rounded-lg hover:bg-cosmic-800/30 transition-colors duration-300 border border-cosmic-600/30 ${isMobile ? 'will-change-transform backface-visibility-hidden' : ''}`}
        layout={!isMobile}
      >
        <div className="flex justify-between items-start mb-2">
          <LocationHeader
            displayName={displayName}
            showOriginalName={showOriginalName}
            location={point}
            language={language}
          />
          
          <SiqsScoreBadge 
            score={point.siqs} 
            compact={true}
            isCertified={!!point.isDarkSkyReserve || !!point.certification}
          />
        </div>
        
        <CertificationBadge 
          certification={point.certification} 
          isDarkSkyReserve={point.isDarkSkyReserve} 
        />
        
        <div className="mb-4 mt-2">
          <LightPollutionIndicator 
            bortleScale={point.bortleScale || 5} 
            size="md"
            showBortleNumber={true}
            className="text-base"
          />
        </div>
        
        <LocationMetadata 
          distance={point.distance} 
          date={point.date}
          latitude={point.latitude}
          longitude={point.longitude}
          locationName={displayName}
        />
        
        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewDetails}
            className="text-primary hover:text-primary-focus hover:bg-cosmic-800/50 sci-fi-btn transition-all duration-300 text-sm"
          >
            {t("View Details", "查看详情")}
          </Button>
        </div>
        
        <RealTimeSiqsFetcher
          isVisible={isVisible}
          showRealTimeSiqs={showRealTimeSiqs}
          latitude={point.latitude}
          longitude={point.longitude}
          bortleScale={point.bortleScale}
          onSiqsCalculated={handleSiqsCalculated}
        />
      </motion.div>
    </VisibilityObserver>
  );
};

export default PhotoLocationCard;

import React, { useState } from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { getCertificationInfo } from './cards/CertificationBadge';
import { getSiqsScore } from '@/utils/siqsHelpers';

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
  showRealTimeSiqs?: boolean;
  isMobile?: boolean;
  onSelect?: (location: SharedAstroSpot) => void;
  onViewDetails: (location: SharedAstroSpot) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ 
  location, 
  index = 0,
  onSelect,
  onViewDetails,
  userLocation,
  showRealTimeSiqs = false
}) => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const certInfo = React.useMemo(() => getCertificationInfo(location), [location]);
  
  const { displayName, showOriginalName } = useDisplayName({
    location,
    language,
    locationCounter: null
  });
  
  const nearestTownInfo = React.useMemo(() => 
    location.latitude && location.longitude ? 
      findNearestTown(location.latitude, location.longitude, language) : 
      null
  , [location.latitude, location.longitude, language]);

  const formatCardDistance = (distance?: number) => {
    if (distance === undefined) return t("Unknown distance", "未知距离");
    
    if (distance < 1) 
      return t(`${Math.round(distance * 1000)} m`, `${Math.round(distance * 1000)} 米`);
    if (distance < 100) 
      return t(`${Math.round(distance)} km`, `${Math.round(distance)} 公里`);
    return t(`${Math.round(distance / 100) * 100} km`, `${Math.round(distance / 100) * 100} 公里`);
  };

  const getLocationId = () => {
    if (!location || !location.latitude || !location.longitude) return null;
    return location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!location || !location.latitude || !location.longitude) return;
    
    const locationId = getLocationId();
    if (!locationId) return;
    
    navigate(`/location/${locationId}`, {
      state: {
        id: locationId,
        name: location.name || '',
        chineseName: location.chineseName || '',
        latitude: location.latitude,
        longitude: location.longitude,
        bortleScale: location.bortleScale || 4,
        siqsResult: {
          score: location.siqs || 0
        },
        certification: location.certification || '',
        isDarkSkyReserve: !!location.isDarkSkyReserve,
        timestamp: new Date().toISOString(),
        fromPhotoPoints: true
      }
    });
  };

  const primaryName = language === 'zh' && location.chineseName ? location.chineseName : (location.name || t("Unnamed Location", "未命名位置"));
  const secondaryName = language === 'zh' ? (location.name || "") : (location.chineseName || "");
  
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [loadingSiqs, setLoadingSiqs] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const [locationCounter] = useState(() => {
    if (!location.id && !location.certification && !location.isDarkSkyReserve) {
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
  
  const displaySiqs = realTimeSiqs !== null ? realTimeSiqs : getSiqsScore(location.siqs);
  
  if (displaySiqs === 0 && !loadingSiqs) {
    return null;
  }
  
  return (
    <VisibilityObserver onVisibilityChange={setIsVisible}>
      <div className={`glassmorphism p-4 rounded-lg hover:bg-cosmic-800/30 transition-colors duration-300 border border-cosmic-600/30 ${isMobile ? 'will-change-transform backface-visibility-hidden' : ''}`}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(15px)',
          transition: `opacity 0.5s, transform 0.5s ease ${Math.min(index * 0.1, 0.5)}s`
        }}>
        <div className="flex justify-between items-start mb-2">
          <LocationHeader
            displayName={displayName}
            showOriginalName={showOriginalName}
            location={location}
            language={language}
          />
          
          <SiqsScoreBadge 
            score={location.siqs} 
            compact={true}
            isCertified={false}
          />
        </div>
        
        {certInfo && (
          <div className="flex items-center mt-1.5 mb-2">
            <div className={`px-2 py-0.5 rounded-full text-xs flex items-center ${certInfo.color}`}>
              {React.createElement(certInfo.icon, { className: "h-4 w-4 mr-1.5" })}
              <span>{certInfo.text}</span>
            </div>
          </div>
        )}
        
        <div className="mb-4 mt-2">
          <LightPollutionIndicator 
            bortleScale={location.bortleScale || 5} 
            size="md"
            showBortleNumber={true}
            className="text-base"
          />
        </div>
        
        <LocationMetadata 
          distance={location.distance} 
          date={location.date}
          latitude={location.latitude}
          longitude={location.longitude}
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
          latitude={location.latitude}
          longitude={location.longitude}
          bortleScale={location.bortleScale}
          onSiqsCalculated={handleSiqsCalculated}
        />
      </div>
    </VisibilityObserver>
  );
};

export default PhotoLocationCard;

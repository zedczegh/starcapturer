
import React, { useState, useCallback, useMemo } from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDisplayName } from "./cards/DisplayNameResolver";
import SiqsScoreBadge from './cards/SiqsScoreBadge';
import VisibilityObserver from './cards/VisibilityObserver';
import RealTimeSiqsProvider from './cards/RealTimeSiqsProvider';
import LocationHeader from './cards/LocationHeader';
import { getCertificationInfo } from './utils/certificationUtils';
import CardContainer from './cards/components/CardContainer';
import LocationInfo from './cards/components/LocationInfo';
import CardActions from './cards/components/CardActions';
import { getSiqsScore } from '@/utils/siqsHelpers';

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
  showRealTimeSiqs?: boolean;
  onSelect?: (location: SharedAstroSpot) => void;
  onViewDetails: (location: SharedAstroSpot) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ 
  location, 
  index = 0,
  onViewDetails,
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const certInfo = useMemo(() => getCertificationInfo(location), [location]);
  
  const { displayName, showOriginalName } = useDisplayName({
    location,
    language,
    locationCounter: null
  });
  
  const getLocationId = useCallback(() => {
    if (!location || !location.latitude || !location.longitude) return null;
    return location.id || `loc-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;
  }, [location]);

  const handleViewDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
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
          score: getSiqsScore(location.siqs) || 0
        },
        certification: location.certification || '',
        isDarkSkyReserve: !!location.isDarkSkyReserve,
        timestamp: new Date().toISOString(),
        fromPhotoPoints: true
      }
    });
  }, [location, navigate, getLocationId]);

  // State management for real-time SIQS with better stability
  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [loadingSiqs, setLoadingSiqs] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [siqsConfidence, setSiqsConfidence] = useState<number>(8);
  
  const isCertified = useMemo(() => 
    Boolean(location.certification || location.isDarkSkyReserve || location.type === 'dark-site'),
    [location]
  );
  
  const handleSiqsCalculated = useCallback((siqs: number | null, loading: boolean, confidence?: number) => {
    if (loading) {
      setLoadingSiqs(true);
      return;
    }
    
    setLoadingSiqs(false);
    setHasAttemptedLoad(true);
    
    // Only update state if we have a real score
    if (siqs !== null && siqs > 0) {
      setRealTimeSiqs(siqs);
      
      if (confidence) {
        setSiqsConfidence(confidence);
      }
    }
  }, []);
  
  // Determine loading state with priority on certified locations
  const showLoadingState = useMemo(() => {
    if (!hasAttemptedLoad && isCertified && isVisible) {
      return true; // Show loading immediately for certified locations
    }
    return loadingSiqs;
  }, [isCertified, loadingSiqs, hasAttemptedLoad, isVisible]);
  
  // Prioritize real-time scores for display - never use default scores
  const displayScore = useMemo(() => {
    // Only use real scores, never default values
    if (realTimeSiqs !== null && realTimeSiqs > 0) {
      return realTimeSiqs;
    }
    const siqsScore = getSiqsScore(location.siqs);
    if (siqsScore > 0) {
      return siqsScore;
    }
    // Return null if no valid score to display
    return null;
  }, [realTimeSiqs, location.siqs]);
  
  return (
    <VisibilityObserver onVisibilityChange={setIsVisible}>
      <CardContainer index={index} isVisible={isVisible} isMobile={isMobile}>
        <div className="flex justify-between items-start mb-2">
          <LocationHeader
            displayName={displayName}
            showOriginalName={showOriginalName}
            location={location}
            language={language}
          />
          
          <SiqsScoreBadge 
            score={displayScore}
            compact={true}
            isCertified={isCertified}
            loading={showLoadingState}
            forceCertified={false}
            confidenceScore={siqsConfidence}
          />
        </div>
        
        <LocationInfo
          location={location}
          certInfo={certInfo}
          displayName={displayName}
          language={language}
        />
        
        <CardActions onViewDetails={handleViewDetails} />
        
        <RealTimeSiqsProvider
          isVisible={isVisible}
          latitude={location.latitude}
          longitude={location.longitude}
          bortleScale={location.bortleScale}
          isCertified={isCertified}
          isDarkSkyReserve={location.isDarkSkyReserve}
          existingSiqs={location.siqs}
          onSiqsCalculated={handleSiqsCalculated}
        />
      </CardContainer>
    </VisibilityObserver>
  );
};

export default React.memo(PhotoLocationCard);

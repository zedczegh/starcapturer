
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useDisplayName } from "./cards/DisplayNameResolver";
import VisibilityObserver from './cards/VisibilityObserver';
import RealTimeSiqsProvider from './cards/RealTimeSiqsProvider';
import LocationHeader from './cards/LocationHeader';
import { getCertificationInfo } from './utils/certificationUtils';
import CardContainer from './cards/components/CardContainer';
import LocationInfo from './cards/components/LocationInfo';
import CardActions from './cards/components/CardActions';
import SiqsDisplay from './cards/components/SiqsDisplay';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { useIsMobile } from "@/hooks/use-mobile";

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
  showRealTimeSiqs?: boolean;
  forceRealTimeSiqs?: boolean;
  onSelect?: (location: SharedAstroSpot) => void;
  onViewDetails: (location: SharedAstroSpot) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ 
  location, 
  index = 0,
  onViewDetails,
  showRealTimeSiqs = true,
  forceRealTimeSiqs = false,
  onSelect
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
    if (onViewDetails) {
      onViewDetails(location);
    } else {
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
    }
  }, [location, navigate, getLocationId, onViewDetails]);

  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [loadingSiqs, setLoadingSiqs] = useState(forceRealTimeSiqs);
  const [isVisible, setIsVisible] = useState(forceRealTimeSiqs);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [siqsConfidence, setSiqsConfidence] = useState<number>(8);
  const [initialScoreSet, setInitialScoreSet] = useState(false);
  
  const isCertified = useMemo(() => 
    Boolean(location.certification || location.isDarkSkyReserve || location.type === 'dark-site'),
    [location]
  );
  
  // If there's a static SIQS already, use it initially to prevent flickering
  useEffect(() => {
    if (!initialScoreSet) {
      const staticSiqs = getSiqsScore(location.siqs);
      if (staticSiqs > 0) {
        setRealTimeSiqs(staticSiqs);
        setInitialScoreSet(true);
      }
    }
  }, [location.siqs, initialScoreSet]);
  
  const handleSiqsCalculated = useCallback((siqs: number | null, loading: boolean, confidenceScore?: number) => {
    if (loading) {
      // Only show loading if we don't already have a score
      if (!realTimeSiqs || realTimeSiqs <= 0) {
        setLoadingSiqs(true);
      }
      return;
    }
    
    setLoadingSiqs(false);
    setHasAttemptedLoad(true);
    
    if (siqs !== null && siqs > 0) {
      setRealTimeSiqs(siqs);
      setInitialScoreSet(true);
      if (confidenceScore) {
        setSiqsConfidence(confidenceScore);
      }
    } else if (!realTimeSiqs && (isCertified || forceRealTimeSiqs)) {
      // If we still don't have a score but this is a certified location, 
      // use the static score if available
      const staticSiqs = getSiqsScore(location.siqs);
      if (staticSiqs > 0) {
        setRealTimeSiqs(staticSiqs);
        setInitialScoreSet(true);
      }
    }
  }, [realTimeSiqs, isCertified, location.siqs, forceRealTimeSiqs]);
  
  const handleCardClick = useCallback(() => {
    if (onSelect) {
      onSelect(location);
    }
  }, [onSelect, location]);
  
  // Force visibility for certified locations and collections view
  const effectiveIsVisible = isCertified || isVisible || forceRealTimeSiqs;
  
  return (
    <VisibilityObserver onVisibilityChange={setIsVisible} forceVisible={forceRealTimeSiqs}>
      <CardContainer 
        index={index} 
        isVisible={effectiveIsVisible} 
        isMobile={isMobile}
        onClick={handleCardClick}
      >
        <div className="flex justify-between items-start mb-2">
          <LocationHeader
            displayName={displayName}
            showOriginalName={showOriginalName}
            location={location}
            language={language}
          />
          
          <SiqsDisplay
            realTimeSiqs={realTimeSiqs}
            loadingSiqs={loadingSiqs}
            hasAttemptedLoad={hasAttemptedLoad || initialScoreSet}
            isVisible={effectiveIsVisible}
            isCertified={isCertified || forceRealTimeSiqs}
            siqsConfidence={siqsConfidence}
            locationSiqs={getSiqsScore(location.siqs)}
          />
        </div>
        
        <LocationInfo
          location={location}
          certInfo={certInfo}
          displayName={displayName}
          language={language}
        />
        
        <CardActions onViewDetails={handleViewDetails} />
        
        {(showRealTimeSiqs || forceRealTimeSiqs) && (
          <RealTimeSiqsProvider
            isVisible={effectiveIsVisible}
            latitude={location.latitude}
            longitude={location.longitude}
            bortleScale={location.bortleScale}
            isCertified={isCertified || forceRealTimeSiqs}
            isDarkSkyReserve={location.isDarkSkyReserve}
            existingSiqs={location.siqs}
            onSiqsCalculated={handleSiqsCalculated}
            forceUpdate={forceRealTimeSiqs} 
          />
        )}
      </CardContainer>
    </VisibilityObserver>
  );
};

export default React.memo(PhotoLocationCard);

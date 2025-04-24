import React, { useState, useCallback, useMemo, useEffect } from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useDisplayName } from "./cards/DisplayNameResolver";
import VisibilityObserver from './cards/VisibilityObserver';
import RealTimeSiqsProvider from './cards/RealTimeSiqsProvider';
import { getCertificationInfo } from './utils/certificationUtils';
import CardContainer from './cards/components/CardContainer';
import LocationInfo from './cards/components/LocationInfo';
import CardActions from './cards/components/CardActions';
import SiqsDisplay from './cards/components/SiqsDisplay';
import { getSiqsScore } from '@/utils/siqsHelpers';
import { useIsMobile } from "@/hooks/use-mobile";
import LocationHeaderMainDisplay from './cards/LocationHeaderMainDisplay';

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
  showRealTimeSiqs?: boolean;
  showBortleScale?: boolean;
  onSelect?: (location: SharedAstroSpot) => void;
  onViewDetails: (location: SharedAstroSpot) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ 
  location, 
  index = 0,
  onViewDetails,
  showRealTimeSiqs = true,
  showBortleScale = true
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const certInfo = useMemo(() => getCertificationInfo(location), [location]);

  const { displayName } = useDisplayName({
    location,
    language,
    locationCounter: null
  });

  const mainName = displayName || "";
  const smallName = (language === "zh"
    ? location.name
    : location.chineseName) || "";
  const showSmallName =
    smallName &&
    smallName !== mainName;

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
        bortleScale: showBortleScale ? (location.bortleScale || 4) : undefined,
        siqsResult: {
          score: getSiqsScore(location.siqs) || 0
        },
        certification: location.certification || '',
        isDarkSkyReserve: !!location.isDarkSkyReserve,
        timestamp: new Date().toISOString(),
        fromPhotoPoints: true
      }
    });
  }, [location, navigate, getLocationId, showBortleScale]);

  const [realTimeSiqs, setRealTimeSiqs] = useState<number | null>(null);
  const [loadingSiqs, setLoadingSiqs] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [siqsConfidence, setSiqsConfidence] = useState<number>(8);
  const [initialScoreSet, setInitialScoreSet] = useState(false);

  const isCertified = useMemo(() => 
    Boolean(location.certification || location.isDarkSkyReserve || location.type === 'dark-site'),
    [location]
  );

  useEffect(() => {
    if (!initialScoreSet) {
      const staticSiqs = getSiqsScore(location.siqs);
      if (staticSiqs > 0 && isCertified) {
        setRealTimeSiqs(staticSiqs);
        setInitialScoreSet(true);
      }
    }
  }, [location.siqs, isCertified, initialScoreSet]);

  const handleSiqsCalculated = useCallback((siqs: number | null, loading: boolean, confidence?: number) => {
    if (loading) {
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
      if (confidence) {
        setSiqsConfidence(confidence);
      }
    } else if (!realTimeSiqs && isCertified) {
      const staticSiqs = getSiqsScore(location.siqs);
      if (staticSiqs > 0) {
        setRealTimeSiqs(staticSiqs);
        setInitialScoreSet(true);
      }
    }
  }, [realTimeSiqs, isCertified, location.siqs]);

  const effectiveIsVisible = isCertified || isVisible;
  
  const locationSiqsScore = getSiqsScore(location.siqs);

  return (
    <VisibilityObserver onVisibilityChange={setIsVisible}>
      <CardContainer index={index} isVisible={effectiveIsVisible} isMobile={isMobile}>
        <div className="flex justify-between items-start mb-2">
          <LocationHeaderMainDisplay
            mainName={mainName}
            originalName={smallName}
            showOriginalName={showSmallName}
          />
          <SiqsDisplay
            realTimeSiqs={realTimeSiqs}
            loadingSiqs={loadingSiqs}
            hasAttemptedLoad={hasAttemptedLoad || initialScoreSet}
            isVisible={effectiveIsVisible}
            isCertified={isCertified}
            siqsConfidence={siqsConfidence}
            locationSiqs={locationSiqsScore}
          />
        </div>
        <LocationInfo
          location={location}
          certInfo={certInfo}
          displayName={mainName}
          language={language}
          showBortleScale={showBortleScale}
        />
        <CardActions onViewDetails={handleViewDetails} />
        {showRealTimeSiqs && (
          <RealTimeSiqsProvider
            isVisible={effectiveIsVisible}
            latitude={location.latitude}
            longitude={location.longitude}
            bortleScale={location.bortleScale}
            isCertified={isCertified}
            isDarkSkyReserve={location.isDarkSkyReserve}
            existingSiqs={location.siqs}
            onSiqsCalculated={handleSiqsCalculated}
            forceUpdate={false}
          />
        )}
      </CardContainer>
    </VisibilityObserver>
  );
};

export default React.memo(PhotoLocationCard);

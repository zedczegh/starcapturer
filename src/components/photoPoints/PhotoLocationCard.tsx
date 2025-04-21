
import React, { useMemo } from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useDisplayName } from "./cards/DisplayNameResolver";
import VisibilityObserver from './cards/VisibilityObserver';
import CardContainer from './cards/components/CardContainer';
import LocationInfo from './cards/components/LocationInfo';
import CardActions from './cards/components/CardActions';
import { useIsMobile } from "@/hooks/use-mobile";
import CollectionSiqsBadge from "@/components/siqs/CollectionSiqsBadge";

interface PhotoLocationCardProps {
  location: SharedAstroSpot;
  index: number;
  onSelect?: (location: SharedAstroSpot) => void;
  onViewDetails: (location: SharedAstroSpot) => void;
  showRealTimeSiqs?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
  // NOTE: Bortle displays intentionally removed for collections cards.
}

// This version is stripped down for Collections usage - no SIQS fetcher, no bortle, no SIQS details popover
const PhotoLocationCard: React.FC<PhotoLocationCardProps> = ({ 
  location, 
  index = 0,
  onViewDetails,
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { displayName, showOriginalName } = useDisplayName({
    location,
    language,
    locationCounter: null
  });

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails(location);
  };

  // Ensure we have a stable and valid siqs value
  const siqsValue = useMemo(() => {
    // Debug log
    console.log(`Location ${location.id} SIQS value:`, location.siqs);
    return location.siqs;
  }, [location.siqs, location.id]);

  // No real-time SIQS, only static SIQS badge!
  return (
    <VisibilityObserver onVisibilityChange={() => {}}>
      <CardContainer index={index} isVisible={true} isMobile={isMobile}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-semibold text-base text-foreground">
              {displayName}
              {showOriginalName && location.name ? (
                <span className="ml-1 text-muted-foreground/70 text-xs">({location.name})</span>
              ) : null}
            </div>
            {location.chineseName && (
              <div className="text-xs text-muted-foreground/80">{location.chineseName}</div>
            )}
          </div>
          <CollectionSiqsBadge siqs={siqsValue} />
        </div>
        <LocationInfo location={location} certInfo={null} displayName={displayName} language={language} />
        <CardActions onViewDetails={handleViewDetails} />
      </CardContainer>
    </VisibilityObserver>
  );
};

export default React.memo(PhotoLocationCard);

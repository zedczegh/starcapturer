
import React from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { Loader2 } from "@/components/ui/loader";
import CommunityMap from "@/components/community/CommunityMap";

interface CommunityMapSectionProps {
  isLoading: boolean;
  sortedAstroSpots: SharedAstroSpot[];
  userLocation: [number, number] | null;
  DEFAULT_CENTER: [number, number];
  isMobile: boolean;
  onMarkerClick: (spot: SharedAstroSpot) => void;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

const CommunityMapSection: React.FC<CommunityMapSectionProps> = ({
  isLoading,
  sortedAstroSpots,
  userLocation,
  DEFAULT_CENTER,
  isMobile,
  onMarkerClick,
  onLocationUpdate
}) => {
  return (
    <div className="rounded-xl mb-9 shadow-glow overflow-hidden ring-1 ring-cosmic-700/10 bg-gradient-to-tr from-cosmic-900 via-cosmic-800/90 to-blue-950/70 relative" style={{ height: 380, minHeight: 275 }}>
      {isLoading ? (
        <div className="absolute inset-0 flex justify-center items-center bg-cosmic-900/20 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary/80" />
        </div>
      ) : (
        <CommunityMap
          center={userLocation || DEFAULT_CENTER}
          locations={sortedAstroSpots ?? []}
          hoveredLocationId={null}
          isMobile={isMobile}
          zoom={userLocation ? 8 : 3}
          onLocationUpdate={onLocationUpdate}
          onMarkerClick={onMarkerClick}
        />
      )}
    </div>
  );
};

export default CommunityMapSection;

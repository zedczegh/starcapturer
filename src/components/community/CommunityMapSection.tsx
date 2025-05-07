
import React from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import CommunityMap from "./CommunityMap";
import { Loader2 } from "@/components/ui/loader";

interface CommunityMapSectionProps {
  isLoading: boolean;
  sortedAstroSpots: SharedAstroSpot[];
  userLocation: [number, number] | null;
  defaultCenter: [number, number];
  onLocationUpdate: (lat: number, lng: number) => void;
}

const CommunityMapSection: React.FC<CommunityMapSectionProps> = ({
  isLoading,
  sortedAstroSpots,
  userLocation,
  defaultCenter,
  onLocationUpdate
}) => {
  return (
    <div 
      className="rounded-xl mb-9 shadow-glow overflow-hidden ring-1 ring-cosmic-700/10 bg-gradient-to-tr from-cosmic-900 via-cosmic-800/90 to-blue-950/70 relative" 
      style={{ height: 380, minHeight: 275 }}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex justify-center items-center bg-cosmic-900/20 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary/80" />
        </div>
      ) : (
        <CommunityMap
          center={userLocation || defaultCenter}
          locations={sortedAstroSpots ?? []}
          hoveredLocationId={null}
          isMobile={false}
          zoom={userLocation ? 8 : 3}
          onLocationUpdate={onLocationUpdate}
        />
      )}
    </div>
  );
};

export default CommunityMapSection;

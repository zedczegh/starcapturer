
import React from "react";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { Loader2 } from "@/components/ui/loader";
import UnifiedCommunityMap from "@/components/maps/UnifiedCommunityMap";
import LocationUpdateInput from "@/components/community/LocationUpdateInput";
import { motion } from "framer-motion";

interface CommunityMapSectionProps {
  isLoading: boolean;
  sortedAstroSpots: SharedAstroSpot[];
  userLocation: [number, number] | null;
  DEFAULT_CENTER: [number, number];
  isMobile: boolean;
  onMarkerClick: (spot: SharedAstroSpot) => void;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

const CommunityMapSection: React.FC<CommunityMapSectionProps> = React.memo(({
  isLoading,
  sortedAstroSpots,
  userLocation,
  DEFAULT_CENTER,
  isMobile,
  onMarkerClick,
  onLocationUpdate
}) => {
  return (
    <div className="space-y-4">
      {/* Location Update Input */}
      {onLocationUpdate && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LocationUpdateInput onLocationUpdate={onLocationUpdate} />
        </motion.div>
      )}
      
      {/* Map Container */}
      <motion.div 
        className="rounded-none sm:rounded-xl mb-6 sm:mb-9 shadow-glow overflow-hidden ring-1 ring-cosmic-700/10 bg-gradient-to-tr from-cosmic-900 via-cosmic-800/90 to-blue-950/70 relative" 
        style={{ height: 380, minHeight: 275 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
      {isLoading ? (
        <motion.div 
          className="absolute inset-0 flex justify-center items-center bg-cosmic-900/20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary/80" />
        </motion.div>
      ) : (
        <UnifiedCommunityMap
          center={userLocation || DEFAULT_CENTER}
          locations={sortedAstroSpots ?? []}
          hoveredLocationId={null}
          isMobile={isMobile}
          zoom={userLocation ? 8 : 3}
          onLocationUpdate={onLocationUpdate}
          onMarkerClick={onMarkerClick}
        />
      )}
      </motion.div>
    </div>
  );
});

CommunityMapSection.displayName = 'CommunityMapSection';

export default CommunityMapSection;

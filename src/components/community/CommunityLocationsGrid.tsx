
import React from "react";
import { motion } from "framer-motion";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { TooltipProvider } from "@/components/ui/tooltip";
import CommunityLocationCard from "./CommunityLocationCard";
import CommunityLocationsEmpty from "./CommunityLocationsEmpty";

interface CommunityLocationsGridProps {
  locations: SharedAstroSpot[] | null;
  onCardClick: (id: string) => void;
}

const CommunityLocationsGrid: React.FC<CommunityLocationsGridProps> = ({ 
  locations,
  onCardClick
}) => {
  // Debug to check loaded locations
  React.useEffect(() => {
    if (locations) {
      console.log(`Loaded ${locations.length} community locations`);
    }
  }, [locations]);

  if (!locations || locations.length === 0) {
    return <CommunityLocationsEmpty />;
  }

  return (
    <TooltipProvider>
      <motion.div 
        className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {locations.map((spot: SharedAstroSpot, index: number) => (
          <CommunityLocationCard
            key={spot.id}
            spot={spot}
            index={index}
            onClick={onCardClick}
            onInView={(spotId) => console.log(`Spot ${spotId} in view`)}
          />
        ))}
      </motion.div>
    </TooltipProvider>
  );
};

export default CommunityLocationsGrid;

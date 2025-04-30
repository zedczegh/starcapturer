
import React from "react";
import { motion } from "framer-motion";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { TooltipProvider } from "@/components/ui/tooltip";
import CommunityLocationCard from "./CommunityLocationCard";
import CommunityLocationsEmpty from "./CommunityLocationsEmpty";
import { useCommunityLocationsSiqs } from "@/hooks/community/useCommunityLocationsSiqs";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface CommunityLocationsGridProps {
  locations: SharedAstroSpot[] | null;
  onCardClick: (id: string) => void;
}

const CommunityLocationsGrid: React.FC<CommunityLocationsGridProps> = ({ 
  locations,
  onCardClick
}) => {
  const { t } = useLanguage();
  const { 
    getSiqsForSpot,
    debouncedSiqsUpdate,
    handleSiqsError,
    handleCardInView,
    attemptedSiqs,
    calculationQueue
  } = useCommunityLocationsSiqs(locations);

  // Debug to check loaded locations
  React.useEffect(() => {
    if (locations) {
      console.log(`Loaded ${locations.length} community locations`);
      locations.forEach(loc => {
        console.log(`Location: ${loc.name}, SIQS: ${typeof loc.siqs === 'object' ? JSON.stringify(loc.siqs) : loc.siqs}, Username: ${loc.username || 'Not set'}`);
      });
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
            onInView={handleCardInView}
            onSiqsCalculated={debouncedSiqsUpdate}
            onSiqsError={(error) => {
              handleSiqsError(error, spot.id);
              toast.error(t("Could not calculate sky quality for this location", "无法计算此位置的天空质量"));
            }}
            getSiqs={getSiqsForSpot}
            attempted={attemptedSiqs}
            inQueue={calculationQueue.includes(spot.id)}
          />
        ))}
      </motion.div>
    </TooltipProvider>
  );
};

export default CommunityLocationsGrid;

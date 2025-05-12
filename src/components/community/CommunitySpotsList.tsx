
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { Circle } from "lucide-react";
import LocationCard from "@/components/LocationCard";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";
import CommunityLocationsSkeleton from "@/components/community/CommunityLocationsSkeleton";
import { motion } from "framer-motion";

interface CommunitySpotsListProps {
  isLoading: boolean;
  sortedAstroSpots: SharedAstroSpot[];
  isMobile: boolean;
  onCardClick: (id: string) => void;
  realTimeSiqs: Record<string, number | null>;
  stabilizedSiqs: Record<string, number | null>;
  loadingSiqs: Record<string, boolean>;
  onSiqsCalculated: (spotId: string, siqs: number | null, loading: boolean, confidence?: number) => void;
}

const CommunitySpotsList: React.FC<CommunitySpotsListProps> = ({
  isLoading,
  sortedAstroSpots,
  isMobile,
  onCardClick,
  realTimeSiqs,
  stabilizedSiqs,
  loadingSiqs,
  onSiqsCalculated
}) => {
  const { t } = useLanguage();

  if (isLoading) {
    return <CommunityLocationsSkeleton />;
  }

  if (!sortedAstroSpots || sortedAstroSpots.length === 0) {
    return (
      <motion.div 
        className="w-full text-muted-foreground/70 text-center py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {t("No community astrospots yet. Be the first to share!", "还没有社区观星点，快来分享吧！")}
      </motion.div>
    );
  }

  // Handle card click with proper event capture and prevention
  const handleCardClick = (id: string, event: React.MouseEvent | React.KeyboardEvent) => {
    // Stop propagation to prevent event bubbling
    if ('stopPropagation' in event) {
      event.stopPropagation();
    }
    if ('preventDefault' in event) {
      event.preventDefault();
    }
    
    // Log the click for debugging
    console.log(`Card clicked for ID ${id}, passing to navigation handler`);
    onCardClick(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="font-bold text-xl mt-12 mb-5 flex items-center gap-2 text-gradient-blue">
        <Circle className="h-4 w-4 text-primary" />
        <span>{t("All Community Astrospots", "全部社区地点")}</span>
        <span className="text-sm font-normal text-muted-foreground ml-2">
          ({t("Sorted by best SIQS score", "按照SIQS评分排序")})
        </span>
      </h2>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {sortedAstroSpots.map((spot, index) => (
          <motion.div
            key={spot.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.4, 
              delay: Math.min(index * 0.05, 0.5),
              ease: "easeOut" 
            }}
          >
            <button
              className="relative text-left w-full group focus:outline-none rounded-xl transition duration-150 ease-in-out hover:shadow-2xl hover:border-primary border-2 border-transparent"
              tabIndex={0}
              onClick={(e) => handleCardClick(spot.id, e)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleCardClick(spot.id, e);
                }
              }}
              aria-label={spot.name}
              style={{ background: "none", padding: 0 }}
            >
              <div className="w-full h-full">
                <RealTimeSiqsProvider
                  isVisible={loadingSiqs[spot.id] || (!realTimeSiqs[spot.id] && !stabilizedSiqs[spot.id])}
                  latitude={spot.latitude}
                  longitude={spot.longitude}
                  bortleScale={spot.bortleScale}
                  existingSiqs={spot.siqs}
                  onSiqsCalculated={(siqs, loading, confidence) =>
                    onSiqsCalculated(spot.id, siqs, loading, confidence)
                  }
                  priorityLevel={isMobile ? 'low' : 'medium'}
                  debugLabel={`community-card-${spot.id.substring(0, 6)}`}
                />
                <div className="transition-shadow group-hover:shadow-xl group-hover:ring-2 group-hover:ring-primary rounded-xl">
                  <LocationCard
                    id={spot.id}
                    name={spot.name}
                    latitude={spot.latitude}
                    longitude={spot.longitude}
                    siqs={stabilizedSiqs[spot.id] ?? realTimeSiqs[spot.id] ?? spot.siqs}
                    timestamp={spot.timestamp}
                    isCertified={false}
                    siqsLoading={loadingSiqs[spot.id] && !stabilizedSiqs[spot.id]}
                  />
                </div>
                <span className="absolute inset-0 rounded-xl z-10 transition bg-black/0 group-hover:bg-primary/5" />
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default CommunitySpotsList;

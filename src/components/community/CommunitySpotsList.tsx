
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { Circle } from "lucide-react";
import LocationCard from "@/components/LocationCard";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";
import CommunityLocationsSkeleton from "@/components/community/CommunityLocationsSkeleton";

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
      <div className="w-full text-muted-foreground/70 text-center py-16">
        {t("No community astrospots yet. Be the first to share!", "还没有社区观星点，快来分享吧！")}
      </div>
    );
  }

  const handleCardClick = (id: string) => {
    console.log("Card clicked:", id);
    onCardClick(id);
  };

  return (
    <>
      <h2 className="font-bold text-xl mt-12 mb-5 flex items-center gap-2 text-gradient-blue">
        <Circle className="h-4 w-4 text-primary" />
        <span>{t("All Community Astrospots", "全部社区地点")}</span>
        <span className="text-sm font-normal text-muted-foreground ml-2">
          ({t("Sorted by best SIQS score", "按照SIQS评分排序")})
        </span>
      </h2>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {sortedAstroSpots.map((spot: any) => (
          <button
            key={spot.id}
            className="relative text-left group focus:outline-none rounded-xl transition duration-150 ease-in-out hover:shadow-2xl hover:border-primary border-2 border-transparent"
            tabIndex={0}
            onClick={() => handleCardClick(spot.id)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleCardClick(spot.id);
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
        ))}
      </div>
    </>
  );
};

export default CommunitySpotsList;

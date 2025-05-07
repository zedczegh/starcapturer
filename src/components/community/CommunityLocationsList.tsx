
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RealTimeSiqsProvider from "@/components/photoPoints/cards/RealTimeSiqsProvider";
import LocationCard from "@/components/LocationCard";
import CommunityLocationsSkeleton from "./CommunityLocationsSkeleton";

interface CommunityLocationsListProps {
  isLoading: boolean;
  sortedAstroSpots: SharedAstroSpot[];
  realTimeSiqs: Record<string, number | null>;
  onSiqsCalculated: (spotId: string, siqs: number | null, loading: boolean) => void;
}

const CommunityLocationsList: React.FC<CommunityLocationsListProps> = ({
  isLoading,
  sortedAstroSpots,
  realTimeSiqs,
  onSiqsCalculated
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleCardClick = (id: string) => {
    navigate(`/astro-spot/${id}`, { 
      state: { from: 'community' } 
    });
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

      {isLoading ? (
        <CommunityLocationsSkeleton />
      ) : sortedAstroSpots && sortedAstroSpots.length > 0 ? (
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
                  isVisible={true}
                  latitude={spot.latitude}
                  longitude={spot.longitude}
                  bortleScale={spot.bortleScale}
                  existingSiqs={spot.siqs}
                  onSiqsCalculated={(siqs, loading) =>
                    onSiqsCalculated(spot.id, siqs, loading)
                  }
                />
                <div className="transition-shadow group-hover:shadow-xl group-hover:ring-2 group-hover:ring-primary rounded-xl">
                  <LocationCard
                    id={spot.id}
                    name={spot.name}
                    latitude={spot.latitude}
                    longitude={spot.longitude}
                    siqs={realTimeSiqs[spot.id] !== undefined ? realTimeSiqs[spot.id] : spot.siqs}
                    timestamp={spot.timestamp}
                    isCertified={false}
                  />
                </div>
                <span className="absolute inset-0 rounded-xl z-10 transition bg-black/0 group-hover:bg-primary/5" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="w-full text-muted-foreground/70 text-center py-16">
          {t("No community astrospots yet. Be the first to share!", "还没有社区观星点，快来分享吧！")}
        </div>
      )}
    </>
  );
};

export default CommunityLocationsList;
